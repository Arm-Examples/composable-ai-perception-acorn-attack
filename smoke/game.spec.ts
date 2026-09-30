import { expect, test } from "@playwright/test";

test.use({
  baseURL: process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:8000",
  viewport: { width: 640, height: 480 },
  deviceScaleFactor: 1,
  screenshot: "only-on-failure",
});

test("starts the game when a real camera detection chops the start acorn", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  let releaseCamera!: () => void;
  const homeVisible = new Promise<void>((resolve) => {
    releaseCamera = resolve;
  });
  let receivedDetection = false;
  await page.routeWebSocket("**/events", async (socket) => {
    // Gate only the connection, so the first real frame cannot skip the title.
    await homeVisible;
    const server = socket.connectToServer();
    server.onMessage((message) => {
      socket.send(message);
      receivedDetection ||= hasUsableDetection(message.toString());
    });
  });

  await expect(async () => {
    expect((await request.get("/health")).ok()).toBe(true);
  }).toPass({ timeout: 60_000 });
  await page.goto("/");
  const canvas = page.locator("#game");
  await expect(canvas).toBeVisible();

  // The 93x33 title is drawn at 2x, centred at (320, 71) at this viewport.
  const title = await page.evaluate(async () => {
    const image = new Image();
    image.src = "/assets/acorn-attack.png";
    await image.decode();
    const template = document.createElement("canvas");
    template.width = 186;
    template.height = 66;
    const context = template.getContext("2d");
    if (context === null) throw new Error("Template canvas 2D is unavailable");
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, 186, 66);
    return Array.from(context.getImageData(0, 0, 186, 66).data);
  });

  const titleMatch = () =>
    canvas.evaluate((element, expected) => {
      const context = (element as HTMLCanvasElement).getContext("2d");
      if (context === null) throw new Error("Game canvas 2D is unavailable");
      const actual = context.getImageData(227, 38, 186, 66).data;
      let opaque = 0;
      let matched = 0;
      for (let index = 0; index < expected.length; index += 4) {
        if (expected[index + 3] !== 255) continue;
        opaque++;
        if (
          actual[index + 3] === 255 &&
          Math.abs(actual[index] - expected[index]) <= 12 &&
          Math.abs(actual[index + 1] - expected[index + 1]) <= 12 &&
          Math.abs(actual[index + 2] - expected[index + 2]) <= 12
        ) {
          matched++;
        }
      }
      return matched / opaque;
    }, title);

  await expect
    .poll(titleMatch, { message: "The title logo is visibly rendered" })
    .toBeGreaterThan(0.98);

  releaseCamera();

  await expect
    .poll(() => receivedDetection, {
      message: "A real detection has confidence >0.5 and a usable box",
      timeout: 60_000,
    })
    .toBe(true);
  await expect
    .poll(titleMatch, {
      message: "The title logo disappears when the game starts",
      timeout: 10_000,
    })
    .toBeLessThan(0.1);
  expect(pageErrors).toEqual([]);
});

function hasUsableDetection(message: string): boolean {
  try {
    const event = JSON.parse(message);
    return event.detections.some(
      ({
        confidence,
        box,
      }: {
        confidence: number;
        box: { x: number; y: number; width: number; height: number } | null;
      }) =>
        Number.isFinite(confidence) &&
        confidence > 0.5 &&
        box !== null &&
        [box.x, box.y, box.width, box.height].every(Number.isFinite) &&
        box.width > 0 &&
        box.height > 0,
    );
  } catch {
    return false;
  }
}
