Element.prototype.drag = function(cfg) {
    cfg = cfg || {};
    let flag = false;
    let x, y;
    let mx, my;
    let target = null;
    this.addEventListener('mousedown', function(e) {
        if (e.which == 1) {
            if (typeof (cfg.bind) === "function") {
                target = cfg.bind.call(this, e) || e.currentTarget;
            } else {
                target = e.currentTarget;
            }
            if (typeof (cfg.filter) === 'function') {
                if (!cfg.filter.call(this, e))
                    return;
            }
            let position = target.getComputedValue('position');
            if (!["relative", "fixed", "absolute"].includes(position)) {
                target.style.position = "relative";
            }
            mx = my = 0;
            x = e.clientX;
            y = e.clientY;
            flag = true;
        }
    });
    this.addEventListener('mouseup', function(e) {
        if (e.which == 1) flag = false;
    })
    this.addEventListener('mousemove', function(e) {
        if (e.which == 1 && flag) {
            let nx = e.clientX, ny = e.clientY;
            let ox = nx - x, oy = ny - y;
            if (cfg.axis == undefined || cfg.axis == 'x' || cfg.axis == 'X') {
                mx += ox;
                target.posX += ox;
            }
            if (cfg.axis == undefined || cfg.axis == 'y' || cfg.axis == 'Y') {
                my += oy;
                target.posY += oy;
            }
            if (typeof (cfg.callback) === "function") {
                cfg.callback.call(target, {
                    'offsetX': mx,
                    'offsetY': oy
                });
            }
            x = nx;
            y = ny;
        }
    });
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

    return {
        "List": List,
        "Show": Show,
        "Test": Test
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

    return {
        "Switch": Switch,
        "Update": Update,
        "Move": Move
    }
}

addEventListener('load', function() {
    let task = new TaskController();
    task.Test(26);
    task.List();
    let date = new DateController();
    date.Switch();
    document.getElementById('ShowAddTask').addEventListener('click', task.Show);
    addEventListener('resize', ()=>date.Update());
    document.getElementById("numTasks").addEventListener('change', function(e) {
        date.Update(e.target.valueAsNumber);
    });
    document.getElementById('tasks-view').drag({
        axis: 'x',
        callback: date.Move
    });
    document.querySelectorAll(".task-pad").forEach(a => a.drag());
})
