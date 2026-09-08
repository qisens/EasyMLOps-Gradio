<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=32&pause=1000&color=FF7C00&center=true&vCenter=true&width=600&lines=EasyMLOps-Gradio;No-Code+YOLO+MLOps+Toolkit;Train.+Infer.+Label.+Monitor." alt="Typing SVG" />

**All-in-one MLOps web toolkit for YOLO detection & segmentation**
From dataset upload to training, inference, labeling, and performance monitoring — all in one browser tab.

<br/>

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Gradio](https://img.shields.io/badge/Gradio-6.2.0-FF7C00?style=for-the-badge&logo=gradio&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-2.9-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![Ultralytics](https://img.shields.io/badge/Ultralytics-YOLO-111F68?style=for-the-badge&logo=ultralytics&logoColor=white)

![GitHub last commit](https://img.shields.io/github/last-commit/qisens/EasyMLOps-Gradio?style=flat-square&color=blue)
![GitHub issues](https://img.shields.io/github/issues/qisens/EasyMLOps-Gradio?style=flat-square&color=yellow)
![GitHub stars](https://img.shields.io/github/stars/qisens/EasyMLOps-Gradio?style=flat-square&color=gold)

<br/>

[Getting Started](#-getting-started) •
[Features](#-features) •
[Project Structure](#-project-structure) •
[Data Prep](#-data-preparation) •
[Contributing](#-contributing)

</div>

---

## 📖 Overview

**EasyMLOps-Gradio** is a [Gradio](https://www.gradio.app/)-based web application that wraps the full
[Ultralytics YOLO](https://github.com/ultralytics/ultralytics) workflow — detection & segmentation —
into a **no-code, browser-driven interface**.

Upload data, train a model, evaluate it, run inference, and relabel weak spots — no notebook, no CLI required.

<br/>

## ✨ Features

<table>
<tr><td width="60px" align="center">🖼️</td><td><b>Image Viewer</b><br/>Browse raw images and inference results (contours) side by side, from a remote or local path.</td></tr>
<tr><td align="center">📂</td><td><b>Dataset Manager</b><br/>Upload images/labels, auto-detect new data, and smart-split into train/val sets.</td></tr>
<tr><td align="center">🏋️</td><td><b>Training Monitor</b><br/>Auto batch-size suggestion based on available VRAM, live loss/mAP charts, and best-checkpoint evaluation.</td></tr>
<tr><td align="center">🔍</td><td><b>Inference</b><br/>Run a trained model over a folder of images; results are saved as images and label coordinates.</td></tr>
<tr><td align="center">⚖️</td><td><b>Model Comparison</b><br/>Compare inference results between an existing model and a newly trained one, side by side.</td></tr>
<tr><td align="center">📊</td><td><b>Performance Monitoring</b><br/>Track inference confidence trends over time and auto-collect low-confidence samples for relabeling.</td></tr>
<tr><td align="center">🏷️</td><td><b>Labeling</b><br/>Canvas-based manual labeling tool, supporting both folder-batch and single-file modes.</td></tr>
</table>

<br/>

## 🎬 Quick Look

<div align="center">

<!-- Replace with an actual screenshot or GIF once available -->
<!-- ![demo](./docs/demo.gif) -->
<i>📸 A demo screenshot/GIF goes here — capture the app in action and drop it in `docs/demo.gif`.</i>

</div>

<br/>

## 🚀 Getting Started

### 1. Clone

```bash
git clone https://github.com/qisens/EasyMLOps-Gradio.git
cd EasyMLOps-Gradio
```

### 2. Set up environment

```bash
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

pip install -r requirements.txt
```

### 3. Point to your YOLO CLI

Edit `core/config.py`:

```python
YOLO_CLI = "/home/<user>/anaconda3/envs/<env-name>/bin/yolo"
```

### 4. Run

```bash
python app.py
```

Open the local URL printed in your terminal (e.g. `http://127.0.0.1:7860`).

<br/>

## 📁 Project Structure

<details>
<summary><b>Click to expand</b></summary>

<br/>

```
EasyMLOps-Gradio/
├── app.py                          # Entry point — assembles all tabs
├── core/                           # Training / config / utility logic
├── ui/tabs/                        # Tab-by-tab UI components (tab1 ~ tab7)
├── json/                           # Frontend JS assets
└── test_yolo_project/              # Runtime working directory (PROJECT_ROOT)
    ├── config/
    │   ├── sample.yaml             # Example YOLO dataset config
    │   └── classes_sample.txt      # Example class list for labeling
    ├── tab2_datasets/               # Uploaded dataset storage
    ├── tab3_training_info/          # Training metadata (auto-generated)
    ├── tab4_inference/              # Inference outputs (auto-generated)
    ├── tab6_datasets_for_labeling/  # Low-confidence samples for relabeling (auto-generated)
    ├── tab6_inf_results/            # Inference results for performance monitoring
    └── runs/                        # YOLO training artifacts (weights, logs)
```

> 💡 `tab3_training_info`, `tab4_inference`, `tab6_datasets_for_labeling`, and `runs` are **output-only** folders populated automatically at runtime — it's normal for them to start empty.

</details>

<br/>

## 📥 Data Preparation

1. Place images and YOLO-format labels (`.txt`) under
   `test_yolo_project/tab2_datasets/2_new_dataset/images` and `/labels` respectively.
2. Open the **"2. Dataset Setup"** tab — new data is auto-detected and can be smart-split into train/val.
3. Use `test_yolo_project/config/sample.yaml` as a template for your own dataset config:

```yaml
path: <your dataset root>
train: images/train
val: images/val
names:
  - class1
  - class2
```

<br/>

## 🌿 Contributing

We don't push directly to `main`. Create a personal working branch instead:

```bash
git checkout -b feature/<name>-<what-you-are-doing>
git push -u origin feature/<name>-<what-you-are-doing>
```

- Large datasets and model weights (`*.pt`) are never committed — see `.gitignore`.
- If you add a new output folder, add a matching `.gitignore` rule; if the empty folder structure should still ship, add a `.gitkeep` inside it.

<br/>

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | [Gradio](https://www.gradio.app/) 6.2.0 |
| Model | [Ultralytics YOLO](https://github.com/ultralytics/ultralytics) 8.3.235 |
| Deep Learning | PyTorch 2.9.1 (CUDA 12.8) |
| Data Processing | OpenCV, Pandas, Polars, NumPy |
| Language | Python 3.12 |

<br/>

---

<div align="center">

⭐ If this project helps your workflow, consider giving it a star!

</div>