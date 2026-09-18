export interface Sprites {
  acorn: HTMLImageElement;
  acornTop: HTMLImageElement;
  acornBottom: HTMLImageElement;
  background: HTMLImageElement;
  bombPinecone: HTMLImageElement;
  brokenHeart: HTMLImageElement;
  explosion: HTMLImageElement;
  heart: HTMLImageElement;
  logo: HTMLImageElement;
  saw: HTMLImageElement;
  sign: HTMLImageElement;
  signWide: HTMLImageElement;
  slash: HTMLImageElement;
  trees: HTMLImageElement;
}

export async function loadSprites(): Promise<Sprites> {
  const [
    acorn,
    acornTop,
    acornBottom,
    background,
    bombPinecone,
    brokenHeart,
    explosion,
    heart,
    logo,
    saw,
    sign,
    signWide,
    slash,
    trees,
  ] = await Promise.all([
    loadImage("/assets/acorn.png"),
    loadImage("/assets/acorn-top.png"),
    loadImage("/assets/acorn-bottom.png"),
    loadImage("/assets/background.png"),
    loadImage("/assets/bomb-pinecone.png"),
    loadImage("/assets/broken-heart.png"),
    loadImage("/assets/explosion.png"),
    loadImage("/assets/heart.png"),
    loadImage("/assets/acorn-attack.png"),
    loadImage("/assets/saw.png"),
    loadImage("/assets/sign.png"),
    loadImage("/assets/sign-wide.png"),
    loadImage("/assets/slash.png"),
    loadImage("/assets/trees.png"),
  ]);
  return {
    acorn,
    acornTop,
    acornBottom,
    background,
    bombPinecone,
    brokenHeart,
    explosion,
    heart,
    logo,
    saw,
    sign,
    signWide,
    slash,
    trees,
  };
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener(
      "error",
      () => reject(new Error(`Failed to load ${source}`)),
      {
        once: true,
      },
    );
    image.src = source;
  });
}
