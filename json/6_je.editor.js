// console.log("🔥 5_js_editor loaded:");

window.js_editor = function (p) {
    console.log("🔥 JS Editor START @ js_editor");
    js_log("js_editor called");
    if (!p) {
        console.log("❌ p is undefined");
        js_log("❌ p is undefined");
        return;
    }
    js_log("keys = " + Object.keys(p).join(", "));

    const res = window.load_json(p);
    if (!res || res.status !== "ok") return p;

    // 🔥 상태 연결
    window.pts_list = res.pts_list;
    window.COLORS = res.colors;
    window.CLASS_NAMES = res.class_names;

    let img_b64 = res.img_b64;
    // let output_box = document.querySelector("#edited_polygon_box textarea");


    // function sync_json() {
    //     const out_annotations = window.pts_list.map(obj => ({
    //         segmentation: [obj.pts.flatMap(pt => [pt.x, pt.y])],
    //         class_id: obj.class_id
    //     }));
    //     output_box.value = JSON.stringify({ annotations: out_annotations });
    // }

    // sync_json()

    // =========================
    // 🔍 DEBUG VARIABLES
    // =========================
    window.debug_click = null;     // 클릭 지점
    window.debug_poly = null;      // 선택된 폴리곤
    window.debug_edge = null;      // 선택된 엣지 {a:{x,y}, b:{x,y}}
    window.selected_poly = null;   //🟥전역 상태 추가: 현재 선택된 폴리곤 index(없으면 null)

    // ========= UNDO/REDO STACK =========
    window.history_stack = [];
    window.redo_stack = [];

    // ============================
    // To enable add polygon mode
    // ============================
    window.add_mode = false;       // 새로운 polygon 생성 모드
    window.new_polygon = [];       // 임시 polygon 점 리스트
    window.new_class_id = 0;       // 새 polygon 클래스 ID

    // ============================
    // CANVAS SETUP
    // ============================
    let canvas = document.getElementById("edit_canvas");
    let ctx = canvas.getContext("2d");

    let img = new Image();
    img.src = "data:image/png;base64," + img_b64;

    let dragging = { poly: null, idx: null };

    window.get_current_json = function () {
        return JSON.stringify({
            annotations: window.pts_list.map(obj => ({
                segmentation: [obj.pts.flatMap(pt => [pt.x, pt.y])],
                class_id: obj.class_id
            }))
        });
    };




    // ============================
    // DRAW FUNCTION
    // ============================
    function draw_all() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        window.pts_list.forEach((obj, idx) => {
            let pts = obj.pts;
            //🟥폴리곤 버그 방지 코드
            if (!pts || pts.length < 3) return;

            let cid = obj.class_id;
            let color = COLORS[cid % COLORS.length];
            let class_name = `${cid}: ${window.CLASS_NAMES[cid] ?? ("class_" + cid)}`;

            // let class_name = CLASS_NAMES[cid] ?? ("class_" + cid);

            // polygon
            ctx.strokeStyle = color;
            ctx.lineWidth = (window.selected_poly === idx) ?4 : 2;

            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            //🟥선택된 폴리곤 하이라이트
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
            ctx.closePath();
            ctx.stroke();

            // control points
            ctx.fillStyle = color;
            pts.forEach(pt => {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
                ctx.fill();
            });

            // centroid
            let cx = 0, cy = 0;
            pts.forEach(pt => { cx += pt.x; cy += pt.y; });
            cx /= pts.length;
            cy /= pts.length;

            // label
            ctx.font = "20px Arial";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 4;
            ctx.strokeText(class_name, cx + 10, cy + 10);

            ctx.fillStyle = color;
            ctx.fillText(class_name, cx + 10, cy + 10);
        });

        window.draw_all = draw_all;


        // save JSON
        let out_annotations = window.pts_list.map(obj => {
            let arr = obj.pts.map(pt => [pt.x, pt.y]).flat();
            return { segmentation: [arr], class_id: obj.class_id };
        });
        // output_box.value = JSON.stringify({ annotations: out_annotations });
        // output_box.dispatchEvent(new Event("input", { bubbles: true }));

        // draw new polygon (in progress)
        if (window.add_mode && window.new_polygon.length > 0) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(window.new_polygon[0].x, window.new_polygon[0].y);
            for (let i = 1; i < window.new_polygon.length; i++)
                ctx.lineTo(window.new_polygon[i].x, window.new_polygon[i].y);
            ctx.stroke();

            window.new_polygon.forEach(pt=>{
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 5, 0, Math.PI*2);
                ctx.fillStyle = "white";
                ctx.fill();
            });
        } // if 닫힘


        //-----------------------------------
        // 🔍 DEBUG OVERLAY
        //-----------------------------------
        if (window.debug_click) {
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(window.debug_click.x, window.debug_click.y, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        if (window.debug_poly) {
            let pts = window.debug_poly.pts;
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
            ctx.closePath();
            ctx.stroke();
        }

        if (window.debug_edge) {
            ctx.strokeStyle = "rgba(0,255,255,0.9)"; // 더 밝은 네온 시안색
            ctx.lineWidth = 8;  // 훨씬 굵게
            ctx.beginPath();
            ctx.moveTo(window.debug_edge.a.x, window.debug_edge.a.y);
            ctx.lineTo(window.debug_edge.b.x, window.debug_edge.b.y);
            ctx.stroke();
        }

    } // draw_all close

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        draw_all();
    };


    // ============================
    // DRAG EVENTS
    // ============================

    //🟥(mx,my)클릭 좌표가 폴리곤 내부인지 검사 > 내부면 True 반환
    function pointInPoly(x, y, pts) {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i].x, yi = pts[i].y;
            const xj = pts[j].x, yj = pts[j].y;

            const intersect =
                ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);

            if (intersect) inside = !inside;
        }
        return inside;
    }
    //🟥클릭 지점이 포함된 폴리곤의 index 찾기
    function findPolyIndexAt(mx, my) {
        // 위에 그려진 폴리곤이 우선 선택되도록 뒤에서부터 탐색
        for (let i = window.pts_list.length - 1; i >= 0; i--) {
            const pts = window.pts_list[i].pts;
            if (!pts || pts.length < 3) continue;   //점 부족 폴리곤은 무시
            if (pointInPoly(mx, my, pts)) return i; //내부면 해당 폴리곤 index 리턴
        }
        return -1;
    }

    canvas.onmousedown = (e) => {

        if (window.add_mode) {
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) / window.canvas_scale;
            const my = (e.clientY - rect.top) / window.canvas_scale;

            // 🟢 현재 상태를 history에 저장해야 ctrl+Z가 작동함
            window.history_stack.push(JSON.stringify({
                pts_list: structuredClone(window.pts_list),
                new_polygon: structuredClone(window.new_polygon),
                add_mode: window.add_mode
            }));
            window.redo_stack = [];

            window.new_polygon.push({ x: mx, y: my });
            draw_all();
            return;
        }
        // Save previous state
        window.history_stack.push(JSON.stringify({
            pts_list: structuredClone(window.pts_list),
            new_polygon: structuredClone(window.new_polygon),
            add_mode: window.add_mode
        }));

        window.redo_stack = [];

        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / window.canvas_scale;
  	    const my = (e.clientY - rect.top) / window.canvas_scale;

        //🟥클릭 시 폴리곤 선택(수정키 없이)
        if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
            const rect = canvas.getBoundingClientRect();
 	        const mx = (e.clientX - rect.left) / window.canvas_scale;
            const my = (e.clientY - rect.top) / window.canvas_scale;

            const pidx = findPolyIndexAt(mx, my);
            // 선택된 폴리곤 저장
            window.selected_poly = (pidx !== -1) ? pidx : null;
            draw_all();

            // 폴리곤 선택해서 클래스 수정하려고 추가
            if (window.selected_poly !== null) {
                const cls = window.pts_list[window.selected_poly].class_id;
                window.dispatchEvent(new CustomEvent("poly_selected", {
                    detail: { class_id: cls }
                }));
            }
        }

        // CTRL + CLICK → 점 삭제
        if (e.ctrlKey) {
            // 🔥 new_polygon 삭제 먼저 체크
            for (let i = 0; i < window.new_polygon.length; i++) {
                let pt = window.new_polygon[i];
                if (Math.hypot(pt.x - mx, pt.y - my) < 10) {

                    // undo 저장
                    window.history_stack.push(JSON.stringify({
                        pts_list: window.pts_list,
                        new_polygon: window.new_polygon,
                        add_mode: window.add_mode
                    }));
                    window.redo_stack = [];

                    window.new_polygon.splice(i, 1);
                    draw_all();
                    return;
                }
            }


            window.pts_list.forEach((obj, pidx) => {
                obj.pts.forEach((pt, idx) => {
                    if (Math.hypot(pt.x - mx, pt.y - my) < 10) {
                        // Undo 기록
                        window.history_stack.push(JSON.stringify({
                            pts_list: window.pts_list,
                            new_polygon: window.new_polygon,
                            add_mode: window.add_mode
                        }));
                        window.redo_stack = [];

                        obj.pts.splice(idx, 1);
                        draw_all();
                    }
                });
            });
            return; // 삭제 후 다른 이벤트 막기
        }

        // SHIFT + CLICK → Edge 에 새 점 삽입
        // SHIFT + CLICK → 가장 가까운 polygon edge 에 점 하나만 삽입

        function pointSegmentDist(px, py, ax, ay, bx, by) {
            const abx = bx - ax;
            const aby = by - ay;
            const apx = px - ax;
            const apy = py - ay;

            const ab_len2 = abx * abx + aby * aby;
            if (ab_len2 === 0) {
                return Math.hypot(px - ax, py - ay);
            }

            let t = (apx * abx + apy * aby) / ab_len2;
            t = Math.max(0, Math.min(1, t));

            const cx = ax + t * abx;
            const cy = ay + t * aby;

            return Math.hypot(px - cx, py - cy);
        }

        function findClosestPolygon(mx, my) {
            let bestPoly = null;
            let bestDist = Infinity;

            window.pts_list.forEach(poly => {
                let pts = poly.pts;
                let minEdgeDist = Infinity;

                for (let i = 0; i < pts.length; i++) {
                    let a = pts[i];
                    let b = pts[(i + 1) % pts.length];

                    let dist = pointSegmentDist(mx, my, a.x, a.y, b.x, b.y);


                    minEdgeDist = Math.min(minEdgeDist, dist);
                }

                if (minEdgeDist < bestDist) {
                    bestDist = minEdgeDist;
                    bestPoly = poly;
                }
            });

            return bestPoly;
        }

        function findClosestEdge(poly, mx, my) {
            let pts = poly.pts;

            let bestIndex = 0;
            let bestDist = Infinity;

            for (let i = 0; i < pts.length; i++) {
                let a = pts[i];
                let b = pts[(i + 1) % pts.length];

                let dist = pointSegmentDist(mx, my, a.x, a.y, b.x, b.y);


                if (dist < bestDist) {
                    bestDist = dist;
                    bestIndex = i;
                }
            }

            return {
                index: bestIndex,
                a: pts[bestIndex],
                b: pts[(bestIndex + 1) % pts.length],
                dist: bestDist
            };
        }

        if (e.shiftKey) {
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) / window.canvas_scale;
            const my = (e.clientY - rect.top) / window.canvas_scale;
            // ★ 클릭 지점 기록
            window.debug_click = { x: mx, y: my };


        // 1) 가장 가까운 폴리곤 찾기
            let targetPoly = findClosestPolygon(mx, my);
            if (!targetPoly) return;

        // 2) 해당 폴리곤 내부에서 가장 가까운 엣지 찾기
            let edgeInfo = findClosestEdge(targetPoly, mx, my);

        // 디버그 표시
            window.debug_poly = targetPoly;
            window.debug_edge = { a: edgeInfo.a, b: edgeInfo.b };
            draw_all();  // 디버그 오버레이 먼저 보여주기
       // threshold 조건

        if (edgeInfo.dist < 10) {
            window.history_stack.push(JSON.stringify({
                pts_list: window.pts_list,
                new_polygon: window.new_polygon,
                add_mode: window.add_mode
            }));
            window.redo_stack = [];

            targetPoly.pts.splice(edgeInfo.index + 1, 0, { x: mx, y: my });
            draw_all();
        }
            return;
        }

        // (C) EXISTING DRAG POINT CODE
        dragging = { poly: null, idx: null };
        window.pts_list.forEach((obj, pidx) => {
            obj.pts.forEach((pt, idx) => {
                if (Math.hypot(pt.x - mx, pt.y - my) < 10) {
                    dragging.poly = pidx;
                    dragging.idx = idx;
                }
            });
        });

         // 🖐 근처에 편집할 점이 없으면 → 이미지 전체를 드래그(팬)하는 모드로 전환
        if (
            dragging.poly === null &&
            !window.add_mode &&
            !e.ctrlKey && !e.shiftKey && !e.altKey
        ) {
            const pidx = findPolyIndexAt(mx, my);

            if (pidx !== -1) {
                // 🔷 폴리곤 내부 클릭 → 전체 이동
                window.history_stack.push(JSON.stringify({
                    pts_list: window.pts_list,
                    new_polygon: window.new_polygon,
                    add_mode: window.add_mode
                }));
                window.redo_stack = [];

                window._dragging_polygon = pidx;
                window._polygon_drag_start = {
                    x: mx, y: my,
                    points: JSON.parse(JSON.stringify(window.pts_list[pidx].pts))
                };
                canvas.style.cursor = "move";
            } else {
                // 🖐 빈 공간 → 이미지 팬
                window._is_panning = true;
                window._pan_start = {
                    x: e.clientX,
                    y: e.clientY,
                    offsetX: window.canvas_offset.x,
                    offsetY: window.canvas_offset.y
                };
                canvas.style.cursor = "grabbing";
            }
        }
    };

    document.onkeydown = (e) => {
        // ⏎ ENTER → New Polygon 작업 중일 때만 Finish Polygon 실행
        if (e.key === "Enter") {
            const tag = (e.target.tagName || "").toLowerCase();
            const isTyping = tag === "input" || tag === "textarea" || tag === "select";
            if (!isTyping && window.add_mode && window.new_polygon.length >= 3) {
                e.preventDefault();
                document.getElementById("finish_poly_btn_el")?.click();
                return;
            }
        }

        //🟥DELETE → 선택된 폴리곤 삭제
        if (e.key === "Delete" && window.selected_poly !== null) {
            //Undo를위한 현재 상태 저장
            window.history_stack.push(JSON.stringify({
                pts_list: structuredClone(window.pts_list),
                new_polygon: structuredClone(window.new_polygon),
                add_mode: window.add_mode
            }));
            window.redo_stack = [];

            //실제 폴리곤 삭제
            window.pts_list.splice(window.selected_poly, 1);
            //선택 상태 초기화
            window.selected_poly = null;
            //화면 다시 그리기
            draw_all();
        }

        // UNDO
        if (e.ctrlKey && e.key === "z") {
        if (window.history_stack.length > 0) {
            window.redo_stack.push(JSON.stringify({
                pts_list: structuredClone(window.pts_list),
                new_polygon: structuredClone(new_polygon),
                add_mode: add_mode
            }));

            let prev = JSON.parse(window.history_stack.pop());
            window.pts_list = prev.pts_list;
            new_polygon = prev.new_polygon;
            add_mode = prev.add_mode;
            draw_all();
        }
    }

// REDO
    if (e.ctrlKey && e.key === "y") {
        if (window.redo_stack.length > 0) {

            // 현재 상태를 history에 저장 (되돌리기 가능하도록)
            window.history_stack.push(JSON.stringify({
                pts_list: structuredClone(window.pts_list),
                new_polygon: structuredClone(new_polygon),
                add_mode: add_mode
            }));

            // redo stack에서 이전 상태 꺼내기
            let next = JSON.parse(window.redo_stack.pop());

            // 상태 복원
            window.pts_list = structuredClone(next.pts_list);
            new_polygon = structuredClone(next.new_polygon ?? []);
            add_mode = next.add_mode ?? false;

            draw_all();
        }
    }

    };

    canvas.onmousemove = (e) => {
        // 🔷 폴리곤 전체 이동 모드
        if (window._dragging_polygon !== null) {
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) / window.canvas_scale;
            const my = (e.clientY - rect.top) / window.canvas_scale;
            const dx = mx - window._polygon_drag_start.x;
            const dy = my - window._polygon_drag_start.y;
            const orig = window._polygon_drag_start.points;

            window.pts_list[window._dragging_polygon].pts =
                orig.map(p => ({ x: p.x + dx, y: p.y + dy }));
            draw_all();
            return;
        }

        // 🖐 팬 모드일 때는 캔버스 위치만 이동시키고 종료
        if (window._is_panning) {
            const dx = e.clientX - window._pan_start.x;
            const dy = e.clientY - window._pan_start.y;
            window.canvas_offset.x = window._pan_start.offsetX + dx;
            window.canvas_offset.y = window._pan_start.offsetY + dy;
            window.applyCanvasTransform && window.applyCanvasTransform();
            return;
        }

        if (dragging.poly === null) return;
        const rect = canvas.getBoundingClientRect();
        window.pts_list[dragging.poly].pts[dragging.idx].x = (e.clientX - rect.left) / window.canvas_scale;
        window.pts_list[dragging.poly].pts[dragging.idx].y = (e.clientY - rect.top) / window.canvas_scale;
        draw_all();
    };

    // 🖐 마우스를 캔버스 밖에서 놓쳐도 확실히 멈추도록 window에 등록
    window.addEventListener("mouseup", () => {
        dragging.poly = null;
        dragging.idx = null;

        window._is_panning = false;
        window._dragging_polygon = null;
        window._polygon_drag_start = null;
        canvas.style.cursor = "default";
    });


    finish_poly=function (cls_value)  {
        // Dropdown 값 그대로 숫자로 변환
        let class_id = Number(cls_value);
        if (isNaN(class_id)) class_id = 0;

        // add mode 종료
        window.add_mode = false;

        // 새로운 polygon 추가
        window.pts_list.push({
            pts: window.new_polygon,
            class_id: class_id
        });

        // 임시 polygon 초기화
        window.new_polygon = [];

        // 다시 그리기
        if (window.draw_all) window.draw_all();

        // JSON 반환
        // return JSON.stringify({
        //     annotations: window.pts_list.map(obj => ({
        //         segmentation: [obj.pts.flatMap(pt => [pt.x, pt.y])],
        //         class_id: obj.class_id
        //     }))
        // });
    }
    // --------------------------------------------------
    // 💾 저장용 토스트 래퍼 함수
    // --------------------------------------------------
    show_saved_toast = function(filename) {
        toast("💾 Saved in download directory → " + filename);
    };
    add_mode_on=function () {
        window.add_mode = true;
        window.new_polygon = [];
        console.log("Add Polygon Mode ON");
        // 🔥 간단한 토스트 메시지
        toast("➕ Add Polygon Mode ON");
    };
}

// 선택된 폴리곤의 클래스 변경하려고 추가
window.change_selected_poly_class = function(new_class_id) {
    console.log("class 변경");

    if (window.selected_poly === null) {
        toast("⚠ 선택된 폴리곤이 없습니다");
        return;
    }

    // undo 기록
    window.history_stack.push(JSON.stringify({
        pts_list: structuredClone(window.pts_list),
        new_polygon: structuredClone(window.new_polygon),
        add_mode: window.add_mode
    }));
    window.redo_stack = [];

    window.pts_list[window.selected_poly].class_id = Number(new_class_id);
    if (window.draw_all) window.draw_all();
    toast("✅ Class updated");

    console.log("✅ class updated",
        window.selected_poly,
        window.pts_list[window.selected_poly]
    );
};

// --------------------------------------------------
// 파일탐색기(저장 대화상자)로 JSON 저장
// --------------------------------------------------
window.save_json_via_filepicker = async function (suggestedName, jsonText) {
    // jsonText가 object여도 안전하게
    if (typeof jsonText !== "string") {
        jsonText = JSON.stringify(jsonText, null, 2);
    }

    const canPick = typeof window.showSaveFilePicker === "function";

    // 1) 미지원이면 다운로드 폴백
    if (!canPick) {
        const blob = new Blob([jsonText], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = suggestedName || "edited.json";
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
        toast("💾 Saved (download) → " + (a.download || "edited.json"));
        return true;
    }

    // 2) 지원이면 저장 대화상자
    try {
        const handle = await window.showSaveFilePicker({
        suggestedName: suggestedName || "edited.json",
        types: [
            {
            description: "JSON Files",
            accept: { "application/json": [".json"] },
            },
        ],
        });

        const writable = await handle.createWritable();
        await writable.write(new Blob([jsonText], { type: "application/json" }));
        await writable.close();

        toast("💾 Saved (picker) → " + (suggestedName || "edited.json"));
        return true;

    } catch (e) {
        if (e && e.name === "AbortError") {
        toast("❎ Save canceled");
        return false;
        }
        console.error(e);
        toast("⚠ Save failed");
        return false;
    }
    };

console.log("[OK] save_json_via_filepicker loaded:", typeof window.save_json_via_filepicker);

window.reset_editor = function () {
    console.log("[editor] reset");

    // 핵심 상태
    window.pts_list = [];
    window.new_polygon = [];
    window.add_mode = false;

    // debug
    window.debug_click = null;
    window.debug_poly = null;
    window.debug_edge = null;

    // canvas
    const canvas = document.getElementById("edit_canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
};


// ==== Ctrl + 마우스 휠 캔버스 확대/축소 ====
(function() {
    if (window._canvas_zoom_bound) return;
    window._canvas_zoom_bound = true;

    window.canvas_scale = window.canvas_scale || 1;
    window.canvas_offset = window.canvas_offset || { x: 0, y: 0 };

    function applyTransform() {
        const c = document.getElementById("edit_canvas");
        if (!c) return;
        c.style.transform =
            `translate(${window.canvas_offset.x}px, ${window.canvas_offset.y}px) scale(${window.canvas_scale})`;
    }
    window.applyCanvasTransform = applyTransform;

    window.addEventListener("wheel", (e) => {
        if (!e.ctrlKey) return;

        const container = document.getElementById("edit_canvas_container");
        if (!container) return;
        if (!container.contains(e.target)) return;

        e.preventDefault();
        e.stopPropagation();

        const canvas = document.getElementById("edit_canvas");
        if (!canvas) return;

        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const oldScale = window.canvas_scale;
        const newScale = Math.min(Math.max(oldScale * zoomFactor, 0.2), 5);

        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        window.canvas_offset.x -= mx * (newScale / oldScale - 1);
        window.canvas_offset.y -= my * (newScale / oldScale - 1);
        window.canvas_scale = newScale;

        applyTransform();
    }, { passive: false, capture: true });
})();