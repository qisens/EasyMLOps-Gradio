# ui/tabs/tab7_labeling_canvas.py
import gradio as gr

def build_tab7_labeling_canvas():
    gr.HTML("""
    <div id="edit_canvas_container" style="
        width:100%;
        height:75vh;
        overflow:hidden;
        position:relative;
        background-color:#f9fafb;
        border:1px dashed #9ca3af;
        border-radius:8px;
    ">
        <canvas
            id="edit_canvas"
            width="800"
            height="600"
            style="
                position:absolute;
                top:0;
                left:0;
                transform-origin:0 0;
                border:1px solid #d1d5db;
                background-color:#ffffff;
            "
        ></canvas>
    </div>
    """)