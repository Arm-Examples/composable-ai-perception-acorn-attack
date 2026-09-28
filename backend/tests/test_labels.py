import pytest

from labels import keep_label

PERSON = {"label": "person", "box": {"x": 1, "y": 2, "width": 3, "height": 4}}
CHAIR = {"label": "chair", "box": {"x": 5, "y": 6, "width": 7, "height": 8}}
UNLABELLED = {"label": None, "box": {"x": 9, "y": 10, "width": 11, "height": 12}}


def test_keep_label_passes_everything_when_no_label_is_configured():
    detections = [PERSON, CHAIR, UNLABELLED]

    kept = keep_label(detections, None)

    assert kept == [PERSON, CHAIR, UNLABELLED]


@pytest.mark.parametrize("label", ["", "   "])
def test_keep_label_passes_everything_when_label_is_blank(label):
    detections = [PERSON, CHAIR]

    kept = keep_label(detections, label)

    assert kept == [PERSON, CHAIR]


def test_keep_label_drops_detections_with_other_labels():
    detections = [PERSON, CHAIR]

    kept = keep_label(detections, "chair")

    assert kept == [CHAIR]


def test_keep_label_ignores_case_and_surrounding_whitespace():
    detections = [PERSON, CHAIR]

    kept = keep_label(detections, " Person ")

    assert kept == [PERSON]


def test_keep_label_passes_detections_without_a_label():
    empty_label = {**UNLABELLED, "label": ""}
    detections = [UNLABELLED, empty_label, CHAIR]

    kept = keep_label(detections, "person")

    assert kept == [UNLABELLED, empty_label]
