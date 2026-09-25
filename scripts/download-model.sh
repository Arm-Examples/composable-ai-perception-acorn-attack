#!/bin/sh
set -eu

env | while IFS="=" read -r name hf_repo; do
  case "$name" in
    OPK_HF_?*) ;;
    *) continue ;;
  esac

  model_id="$(printf '%s' "${name#OPK_HF_}" | tr '[:upper:]' '[:lower:]')"
  hf_repo="${hf_repo#https://huggingface.co/}"
  hf_repo="${hf_repo%/}"
  case "$hf_repo" in
    ""|/*|*//*|*/*/*|*[\?\#\ ]*) exit 1 ;;
  esac

  model_dir="/models/$model_id"

  # Fetch the model package descriptors.
  mkdir -p "$model_dir"
  url="https://huggingface.co/$hf_repo/resolve/main"
  curl -fsSL -H "Authorization: Bearer $HF_TOKEN" "$url/arm/opk/opchain.json" -o "$model_dir/opchain.json"
  sed -i 's#"modelDescriptor": "arm/opk/model.json"#"modelDescriptor": "model.json"#' "$model_dir/opchain.json"
  curl -fsSL -H "Authorization: Bearer $HF_TOKEN" "$url/arm/opk/model.json" -o "$model_dir/model.json"
  model_file="$(sed -n 's/.*"modelFile": "\([^"]*\)".*/\1/p' "$model_dir/model.json")"
  case "$model_file" in
    ""|/*|*..*) exit 1 ;;
  esac

  mkdir -p "$(dirname "$model_dir/$model_file")"
  curl -fsSL -H "Authorization: Bearer $HF_TOKEN" "$url/$model_file" -o "$model_dir/$model_file"
done
