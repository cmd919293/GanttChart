Element.prototype.drag = function(cfg) {
    cfg = cfg || {};
    let flag = false;
    let x, y;
    let mx = 0, my = 0;
    let origin = this;
    function drag_start(e) {
        if (typeof(cfg.handle) === "function") {
            let target = cfg.handle.call(origin, e);
            if (!e.path.includes(target)) {
                return;
            }
        } else if (typeof(cfg.handle) === "string") {
            try {
                let target = origin.querySelector(cfg.handle);
                if (!e.path.includes(target)) {
                    return;
                }
            } catch {
                return;
            }
        }
        let position = getComputedStyle(origin).getPropertyValue('position');
        if (!["relative", "fixed", "absolute"].includes(position)) {
            origin.style.position = "relative";
        }
        if (e instanceof TouchEvent) {
            document.addEventListener('touchmove', dragging, {passive: false});
            document.addEventListener('touchend', drag_end, {passive: false, once: true});
            x = e.targetTouches[0].clientX;
            y = e.targetTouches[0].clientY;
        } else if (e.which == 1) {
            document.addEventListener('mouseup', drag_end, {once: true});
            document.addEventListener('mousemove', dragging);
            x = e.clientX;
            y = e.clientY;
        }
        if (typeof(cfg.start) === "function") {
            cfg.start.call(origin, e);
        }
        flag = true;
    }
    function dragging(e) {
        if (flag && ((e instanceof TouchEvent) || e.which == 1)) {
            let nx, ny;
            if ('targetTouches' in e) {
                nx = e.targetTouches[0].clientX;
                ny = e.targetTouches[0].clientY;
            } else {
                nx = e.clientX;
                ny = e.clientY;
            }
            let ox = nx - x, oy = ny - y;
            if (cfg.axis == undefined || cfg.axis == 'x' || cfg.axis == 'X') {
                mx += ox;
                ox += parseFloat(getComputedStyle(origin).getPropertyValue('left') || 0);
                origin.style.left = `${ox}px`;
            }
            if (cfg.axis == undefined || cfg.axis == 'y' || cfg.axis == 'Y') {
                my += oy;
                oy += parseFloat(getComputedStyle(origin).getPropertyValue('top') || 0);
                origin.style.top = `${oy}px`;
            }
            if (typeof (cfg.callback) === "function") {
                cfg.callback.call(origin, e, {
                    'x': mx,
                    'y': my
                });
            }
            x = nx;
            y = ny;
            e.preventDefault();
        } else {
            drag_end(e);
        }
    }
    function drag_end(e) {
        if (flag) {
            flag = false;
            if (e instanceof TouchEvent) {
                document.removeEventListener('touchmove', dragging);
            } else if (e.which == 1 || e.which == 0) {
                document.removeEventListener('mousemove', dragging);
            } else {
                flag = true;
            }
            if (!flag && typeof(cfg.end) === "function") {
                cfg.end.call(origin, e);
            }
        }
    }
    this.addEventListener('mousedown', function(e) {
        drag_start(e);
    });
    this.addEventListener('touchstart', function(e) {
        drag_start(e);
    }, {passive: false});
}
Element.prototype.getComputedValue = function(property) {
    return getComputedStyle(this).getPropertyValue(property);
}
Object.defineProperty(Element.prototype, "left", {
    get: function() {
        return this.getBoundingClientRect().left;
    }
});
Object.defineProperty(Element.prototype, "top", {
    get: function() {
        return this.getBoundingClientRect().top;
    }
});
Object.defineProperty(Element.prototype, "right", {
    get: function() {
        return this.getBoundingClientRect().right;
    }
});
Object.defineProperty(Element.prototype, "bottom", {
    get: function() {
        return this.getBoundingClientRect().bottom;
    }
});
Object.defineProperty(Element.prototype, "width", {
    get: function() {
        return this.getBoundingClientRect().width;
    }
});
Object.defineProperty(Element.prototype, "height", {
    get: function() {
        return this.getBoundingClientRect().height;
    }
});
Object.defineProperty(Element.prototype, "posX", {
    get: function() {
        return parseFloat(this.getComputedValue('left') || 0);
    },
    set: function(v) {
        this.style.left = `${v}px`;
    }
});
Object.defineProperty(Element.prototype, "posY", {
    get: function() {
        return parseFloat(this.getComputedValue('top') || 0);
    },
    set: function(v) {
        this.style.top = `${v}px`;
    }
});

function TaskController() {
    let tasksData = {
        "Name": "Gantt Chart 1",
        "Tasks": []
    };
    let tasks = document.getElementById('tasks-list');

    function List() {
        document.title = tasksData.Name;
        let tmp = [];
        tmp.push(...tasksData.Tasks);
        while (tmp.length > 0) {
            let v = tmp.shift();
            tasks.append(GetTaskBar(v));
            tmp.push(...v.Tasks);
        }
    }
    
    function TaskPad() {
        let pad = document.createElement('div');
        pad.classList.add('task-pad');
        let icon = document.createElement('div');
        icon.classList.add('drag-icon');
        let rm = document.createElement('div');
        rm.classList.add('rm-icon');
        let dict = [
            ['Name', 'input', {type: 'text', required: 'true'}],
            ['Start', 'input', {type: 'date', required: 'true'}],
            ['End', 'input', {type: 'date', required: 'true'}],
            ['Description', 'textarea']
        ];
        dict = dict.map((a, id) => {
            let label = document.createElement('label');
            let span = document.createElement('span');
            let ele = document.createElement(a[1]);
            span.textContent = a[0];
            Object.entries(a[2] || {}).forEach(i => ele.setAttribute(...i));
            label.append(span, ele);
            return label;
        });
        rm.addEventListener('click', function(e) {
            rm.parentElement.classList.add('fixed-center');
            setTimeout(function() {
                if (confirm("Are you sure you want to delete this task")) {
                    rm.parentElement.remove();
                } else {                
                    rm.parentElement.classList.remove('fixed-center');
                }
            }, 0);
        });
        dict[1].querySelector('input[type="date"]').addEventListener('change', function(e) {
            dict[2].querySelector('input[type="date"]').min = this.value;
        });
        pad.append(icon, rm, ...dict);
        pad.drag({
            handle: ".drag-icon",
            start: function(e) {
                this.style.zIndex = 1;
            },
            end: function(e) {
                this.style.zIndex = "";
                if (!this.classList.contains('minima')) {
                    this.style.left = "";
                    this.style.top = "";
                } else {
                    document.getElementById('tasks-view').addEventListener('mouseenter', function(e) {
                        console.log(e);
                    }, {once: true});
                }
            },
            callback: function(e, offset) {
                let hasClass = this.classList.contains('minima');
                let bounds = this.getBoundingClientRect();
                if (!hasClass && offset.x < -50) {
                    let l = bounds.left, t = bounds.top;
                    this.classList.add('minima');
                    bounds = this.getBoundingClientRect();
                    this.posX += l - bounds.left;
                    this.posY += t - bounds.top;
                } else if (hasClass && offset.x >= -50) {
                    let l = bounds.left, t = bounds.top;
                    this.classList.remove('minima');
                    bounds = this.getBoundingClientRect();
                    this.posX += l - bounds.left;
                    this.posY += t - bounds.top;
                }
            }
        });
        return pad;
    }

    function GetTaskBar(task) {
        let ele = document.createElement('span');
        ele.dataset["taskName"] = task.Name;
        return ele;
    }

    function Show() {
        let view = document.getElementById('task-side');
        if (view.classList.contains('show')) {
            view.querySelectorAll('.task-pad').forEach(a => a.posX = a.posY = 0);
            view.classList.remove('show');
        } else {
            view.classList.add('show');
        }
    }

/*     function virtual_wheel (e) {
        if (TaskController.isRegister && TaskController.isRegister != virtual_wheel) {
            document.removeEventListener('wheel', virtual_wheel);
        } else if (e.path.includes(document.getElementById('task-side'))){
            TaskController.isRegister = virtual_wheel;
            let v = parseFloat(getComputedStyle(document.getElementById('task-side')).getPropertyValue("--offset-deltaY")) - e.deltaY;
            v = Math.min(v, 0);
            document.getElementById('task-side').style.setProperty("--offset-deltaY", `${v}px`);
            e.preventDefault(); 
        }
    }
    
    document.addEventListener('wheel', virtual_wheel, {passive: false}); */

    function Test(n=5) {
        let obj = []
        for (let i = 0; i < n; i++) {
            let temp = {};
            temp['Name'] = String.fromCharCode(97 + i).repeat(3);
            temp['Tasks'] = []
            obj.push(temp);
        }
        tasksData["Tasks"] = obj;
        tasksData["Name"] = "Gantt Chart";
    }

    function PadTest(n=2) {
        let view = document.getElementById('task-side');
        for(let i = 0; i < n; i++) {
            view.append(TaskPad());
        }
    }
    
    return {
        "List": List,
        "Show": Show,
        "Test": Test,
        "AddPad": PadTest
    }
}

function DateController() {
    let view = document.getElementById('tasks-view');
    let preSize = null;
    function Switch(date) {
        date = date ? new Date(date) : new Date();
        view.innerHTML = '';
        let c = 2 + parseInt(document.documentElement.getComputedValue('--show-count'));
        date.setDate(date.getDate() - 1);
        for (let i = 0; i < c; i++) {
            view.append(GetColumn(date));
            date.setDate(date.getDate() + 1);
        }
        preSize = view.firstElementChild.width
        view.posX = -preSize;
    }

    function Update(count) {
        if (count == null) {
            count = parseInt(document.documentElement.getComputedValue('--show-count'));
        } else {
            document.documentElement.style.setProperty("--show-count", count);
        }
        let xMax = window.innerWidth;
        let size = view.firstElementChild.width;
        let sx = size / preSize;
        let x = view.posX * sx;
        preSize = size;
        view.posX = x;
        if ((view.lastElementChild.right - xMax) < 100) {
            let t = new Date(view.lastElementChild.dataset["date"]);
            t.setDate(t.getDate() + 1);
            view.lastElementChild.after(GetColumn(t));
        }
    }
    function Move() {
        let xMin = document.getElementById("tasks-list").right;
        let xMax = window.innerWidth;
        let x = view.posX;
        let fTask = view.firstElementChild;
        let lTask = view.lastElementChild;
        if ((xMin - fTask.right) > 20) {
            x += fTask.width;
            fTask.remove();
            let t = new Date(lTask.dataset["date"]);
            t.setDate(t.getDate() + 1);
            lTask.after(GetColumn(t));
        } else if ((lTask.left - xMax) > 20) {
            x -= lTask.width;
            lTask.remove();
            let t = new Date(fTask.dataset["date"]);
            t.setDate(t.getDate() - 1);
            fTask.before(GetColumn(t));
        }
        view.posX = x;
    }

    function GetColumn(date) {
        let task = document.createElement("div");
        let taskDate = document.createElement("div");
        let taskFill = document.createElement("div");
        task.classList.add('task', 'flex', 'flex-column');
        taskDate.classList.add('task-date');
        taskFill.classList.add('task-fill');
        let m = (date.getMonth() + 1).toString().padStart(2, '0');
        let d = (date.getDate()).toString().padStart(2, '0');
        taskDate.dataset["date"] = m + "/" + d;
        task.append(taskDate, taskFill);
        task.dataset["date"] = date.toISOString();
        return task;
    }
    
    view.drag({axis: 'x', callback: Move});
    
    return {
        "Switch": Switch,
        "Update": Update,
        "Move": Move
    }
}

addEventListener('load', function() {
    let task = new TaskController();
    task.Test(10);
    task.List();
    task.AddPad(5);
    let date = new DateController();
    date.Switch();
    document.getElementById('ShowAddTask').addEventListener('click', task.Show);
    addEventListener('resize', ()=>date.Update());
    document.getElementById("numTasks").addEventListener('change', function(e) {
        date.Update(e.target.valueAsNumber);
    });
});
