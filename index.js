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
Date.prototype.addDate = function(value) {
    let x = new Date(this);
    x.setDate(x.getDate() + value);
    return x;
}
Date.prototype.addWeek = function(value) {
    let x = new Date(this);
    x.setDate(x.getDate() + value * 7);
    return x;
}
Date.prototype.addMonth = function(value) {
    let x = new Date(this);
    x.setMonth(x.getMonth() + value);
    return x;
}
Date.prototype.addMinutes = function(value) {
    let x = new Date(this);
    x.setMinutes(x.getMinutes() + value);
    return x;
}
Date.prototype.toLocalISOString = function() {
    return this.addMinutes(-this.getTimezoneOffset()).toISOString();
}

function DateConverter(type) {
    let input = document.createElement('input');
    input.type = type || 'date';
    function getDate(date) {
        input.valueAsDate = new Date(date).addMinutes(-date.getTimezoneOffset());
        return input.valueAsDate.addMinutes(date.getTimezoneOffset());
    }
    function getString(date) {
        input.valueAsDate = new Date(date).addMinutes(-date.getTimezoneOffset());
        return input.value;
    }
    return {
        get Type() {
            return input.type.toLowerCase();
        },
        set Type(type) {
            input.type = type || input.type;
        },
        "GetDate": getDate,
        "GetString": getString
    }
}

function Database() {
    this.index = 1;
    this.name = "Untitled";
    this.type = "date";
    this.offset = -1;
    this.source = {};
    this.tree = {};

    function Load(obj) {
        let tasks = obj.tasks;
        this.name = obj.name;
        this.date = obj.date;
        this.type = obj.type;
        this.offset = obj.offset;
        this.source = {};
        for (let i = 0; i < tasks.length; i++) {
            Insert.call(this, tasks[i]);
        }
    }

    function Save(date) {
        let tasks = [];
        let temp = [];
        temp.push(this.tree);
        while (temp.length > 0) {
            let t = temp.shift();
            for (let i in t) {
                temp.push(t[i]);
                let task = this.GetDataById(i);
                tasks.push({
                    "id": task.id,
                    "name": task.name,
                    "start_time": task.start_time.toLocalISOString(),
                    "end_time": task.end_time.toLocalISOString(),
                    "description": task.description,
                    "finish": task.finish || false,
                    "pid": task.pid
                });
            }
        }
        return JSON.stringify({
            "name": this.name,
            "date": date ? new Date(date) : new Date(),
            "type": this.type,
            "offset": this.offset,
            "tasks": tasks
        });
    }

    function create(task, id, pid) {
        let t1 = new Date(task.start_time);
        let t2 = new Date(task.end_time);
        t1 = t1.addMinutes(t1.getTimezoneOffset());
        t2 = t2.addMinutes(t2.getTimezoneOffset());
        return {
            "id": id,
            "name": task.name,
            "start_time": t1,
            "end_time": t2,
            "min_date": t1,
            "max_date": t2,
            "finish": task.finish,
            "description": task.description,
            "pid": pid
        }
    }

    function Insert(task, pid) {
        let id = task.id || this.index;
        if (!this.GetDataById(id)) {
            let obj = create.call(this, task, id, task.pid || 0);
            Update.call(this, obj);
            this.index = Math.max(this.index, id + 1);
        }
        return id;
    }

    function Update(task) {
        let obj = this.GetDataById(task.id) || task;
        let pid = obj.pid || 0;
        let t1 = obj.start_time, t2 = obj.end_time;
        Query.call(this, function (a) {
            return a.pid == task.id;
        }).forEach(function (val) {
            let x = val.min_date;
            let y = val.max_date;
            if (x < t1) {
                t1 = x;
            }
            if (t2 < y) {
                t2 = y;
            }
        });
        obj.min_date = t1;
        obj.max_date = t2;
        let path = [];
        for (let tmp = this.GetDataById(pid);tmp; tmp = this.GetDataById(tmp.pid)) {
            path.push(tmp.id);
        }
        function _(tree, id) {
            if (id == undefined) {
                setDataById.call(this, obj.id, obj);
                tree[obj.id] = tree[obj.id] || {};
                return [obj.min_date, obj.max_date];
            }
            tree = tree[id];
            let t = this.GetDataById(id);
            let min = t.start_time, max = t.end_time;
            let dateRange = _.call(this, tree, path.pop());
            if (dateRange[0] < min) {
                min = dateRange[0];
            }
            if (max < dateRange[1]) {
                max = dateRange[1];
            }
            for (let node in tree) {
                let n = this.GetDataById(node);
                if (n.min_date < min) {
                    min = n.min_date;
                }
                if (max < n.max_date) {
                    max = n.max_date;
                }
            }
            t.min_date = min;
            t.max_date = max;
            return [min, max];
        }
        _.call(this, this.tree, path.pop());
    }

    function Delete(id, withChild=true) {
        let path = [];
        for (let tmp = this.GetDataById(id);tmp; tmp = this.GetDataById(tmp.pid)) {
            path.push(tmp.id);
        }
        function del(tree) {
            for (let i in tree) {
                del.call(this, tree[i]);
                removeDataById.call(this, i);
                delete tree[i];
            }
        }
        function _(tree, idx) {
            if (idx == id) {
                if (withChild) {
                    del.call(this, tree[idx]);
                } else {
                    let d1 = this.GetDataById(idx);
                    for (let i in tree[idx]) {
                        tree[i] = tree[idx][i];
                        let d2 = this.GetDataById(i);
                        d2.pid = d1.pid;
                    }
                }
                removeDataById.call(this, idx);
                delete tree[idx];
            } else {
                tree = tree[idx];
                _.call(this, tree, path.pop());
                let task = this.GetDataById(idx);
                let min = task.start_time, max = task.end_time;
                for (let i in tree) {
                    let v = this.GetDataById(i);
                    if (v.min_date < min) {
                        min = v.min_date;
                    }
                    if (max < v.max_date) {
                        max = v.max_date;
                    }
                }
                task.min_date = min;
                task.max_date = max;
            }
        }
        _.call(this, this.tree, path.pop());
    }

    function Query(func) {
        let result = [];
        Object.entries(this.source).forEach(task => {
           if (func.call(self, task[1])) {
               result.push(task[1]);
           }
        });
        return result;
    }

    function TaskTree() {
        let tasks = [];
        let depth = 0;
        function _(tree, level) {
            for (let i in tree) {
                tasks.push([this.GetDataById(i), level]);
                depth = level + 1 > depth ? level + 1 : depth;
                _.call(this, tree[i], level + 1);
            }
        }
        _.call(this, this.tree, 0);
        return [tasks, depth];
    }

    function GetDataById(id) {
        return this.source[id];
    }

    function setDataById(id, obj) {
        return this.source[id] = obj;
    }

    function removeDataById(id) {
        delete this.source[id];
    }

    function Test() {
        Load.call(this, {
            "name":"Test1",
            "date":"2019-12-25T00:00:00.000Z",
            "type": "week",
            "offset": -1,
            "tasks":[
                {"id":1,"name":"aaa","start_time":"2019-12-23T00:00:00.000Z","end_time":"2019-12-25T00:00:00.000Z","description":"this is a task named aaa","pid":0},
                {"id":2,"name":"bbb","start_time":"2019-12-23T00:00:00.000Z","end_time":"2019-12-24T00:00:00.000Z","description":"this is a task named bbb","pid":1},
                {"id":3,"name":"ccc","start_time":"2019-12-24T00:00:00.000Z","end_time":"2019-12-25T00:00:00.000Z","description":"this is a task named ccc","pid":2},
                {"id":4,"name":"ddd","start_time":"2019-12-25T00:00:00.000Z","end_time":"2019-12-27T00:00:00.000Z","description":"this is a task named ddd","pid":3},
                {"id":5,"name":"eee","start_time":"2019-12-24T00:00:00.000Z","end_time":"2019-12-26T00:00:00.000Z","description":"this is a task named eee","pid":4}
            ]});
    }

    this.Load = Load;
    this.LoadLocal = function () {
        if (localStorage['source']) {
            this.Load(JSON.parse(localStorage['source']));
        }
    }
    this.TaskTree = TaskTree;
    this.GetDataById = GetDataById;
    this.Insert = Insert;
    this.Query = Query;
    this.Update = Update;
    this.Delete = Delete;
    this.Save = Save;
    this.Test = Test;
}

function TaskController() {
    let self = this;
    let tasks = document.getElementById('tasks-list');
    let dateCtrl = undefined;
    let nextDateFunc = undefined;

    function taskPad() {
        let pad = document.createElement('form');
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
        let inputs = {};
        dict = dict.map((a, id) => {
            let label = document.createElement('label');
            let span = document.createElement('span');
            let ele = document.createElement(a[1]);
            span.textContent = a[0];
            Object.entries(a[2] || {}).forEach(i => ele.setAttribute(...i));
            label.append(span, ele);
            inputs[a[0]] = ele;
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
                let valid = this.checkValidity();
                if (this.classList.contains('minima') && valid) {
                    this.hidden = true;
                    document.getElementById('tasks-view').addEventListener('mouseover', function(e) {
                        let task = {
                            "name": inputs.Name.value,
                            "start_time": inputs.Start.valueAsDate,
                            "end_time": inputs.End.valueAsDate,
                            "description": inputs.Description.value
                        }
                        if (e.target.classList.contains('task-bar')) {
                            task["pid"] = e.target.dataset['index'];
                        }
                        self.db.Insert(task);
                        self.Redraw();
                        pad.remove();
                    }, {once: true});
                } else {
                    this.classList.remove('minima');
                    this.style.left = "";
                    this.style.top = "";
                    this.reportValidity();
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

    function makeConnection() {
        let conn = document.createElement('div');
        //div.append(conn);
    }

    function getTaskTag(task, level, needPadding) {
        let ele = document.createElement('span');
        ele.dataset["taskName"] = task.name;
        ele.dataset["index"] = task.id;
        ele.style.setProperty("--list-level", level);
        if (needPadding) {
            ele.style.marginTop = '.75em';
        } else {
            ele.style.fontSize = "20px";
        }
        ele.draggable = true;
        ele.addEventListener('click', function() {
            dateCtrl.Switch(task.start_time);
        });
        ele.addEventListener('dragstart', function (e) {
            let tag = e.target;
            e.dataTransfer.setData("text", tag.dataset['index']);
            e.effectAllowed = "move";
        });
        return ele;
    }

    function getTaskBar(task, left) {
        let min = task.start_time, max = task.end_time;
        if (min < left)  min = left;
        let position = this.computeScaler(min, max);
        let first = document.querySelector("#tasks-list > span:first-of-type");
        let top = document.querySelector(`span:not(.task-bar)[data-index='${task.id}']`);
        let div = document.createElement('div');
        div.style.zIndex = document.documentElement.getComputedValue('--list-depth') - top.getComputedValue('--list-level');
        top = top.offsetTop;
        div.classList.add('task-bar');
        if (task.finish) {
            div.classList.add('task-finish');
        }
        div.style.setProperty("--task-bar-left", position[0]);
        div.style.setProperty("--task-bar-right", position[1]);
        div.style.top = top + 'px';
        div.dataset['index'] = task.id;
        div.addEventListener('click', function (e) {
            showContextMenu.call(this, e, task);
        });
        return div;
    }

    function AddLastDateTask(container, st, ed) {
        if (self.db) {
            container = container.querySelector('.task-fill');
            let tasks = self.db.Query(function(task) {
               let t1 = task.start_time;
               return st <= t1 && t1 < ed;
            });
            for (let i = 0; i < tasks.length; i++) {
                let task = tasks[i];
                container.append(getTaskBar.call(this, task, st));
            }
            makeConnection.call(this);
        }
    }

    function AddTaskBar(container) {
        if (self.db) {
            container.querySelectorAll('.task-bar').forEach(a => a.remove());
            for (let i = 0; i < container.childElementCount; i++) {
                let child = container.children[i];
                let st = new Date(child.dataset["date"]);
                st = st.addMinutes(st.getTimezoneOffset());
                let ed = nextDateFunc(st);
                AddLastDateTask.call(this, child, st, ed);
            }
            let first = container.firstElementChild;
            let st = new Date(first.dataset["date"]);
            st = st.addMinutes(st.getTimezoneOffset());
            let ed = nextDateFunc(st);
            container = first.querySelector('.task-fill');
            let tasks = self.db.Query(function(task) {
               let t1 = task.start_time;
               let t2 = task.end_time;
               return t1 < st && (t2 > ed || (st < t2 && t1.getTime() != t2.getTime()));
            });
            for (let i = 0; i < tasks.length; i++) {
                let task = tasks[i];
                container.append(getTaskBar.call(this, task, st));
            }
            makeConnection.call(this);
        }
    }

    function AddFirstDateTask(container, st, ed) {
        if (self.db) {
            let next = container.nextElementSibling.querySelectorAll('.task-fill > .task-bar');
            container = container.querySelector('.task-fill');
            let tasks = self.db.Query(function(task) {
                let t1 = task.start_time;
                let t2 = task.end_time;
                if (st.getTime() == t1.getTime() && t1.getTime() == t2.getTime()) {
                    return true;
                } else {
                    return st < t2 && t2 <= ed && t1.getTime() != t2.getTime();
                }
            });
            for (let i = 0; i < tasks.length; i++) {
                let task = tasks[i];
                container.append(getTaskBar.call(this, task, st));
            }
            for (let i = 0; i < next.length; i++) {
                let bar = next[i];
                let cur = this.db.GetDataById(bar.dataset['index']);
                if (cur.start_time < ed) {
                    next[i].remove();
                    container.append(getTaskBar.call(this, cur, st));
                }
            }
            makeConnection.call(this);
        }
    }

    function Bind(database, dateController) {
        this.db = database;
        dateCtrl = dateController;
    }

    function List() {
        document.title = this.db.name;
        tasks.innerHTML = "";
        let info = this.db.TaskTree();
        let c = 0;
        info[0].forEach(function(task) {
            if (task[1] == 0) {
                c++;
            }
            let tag = getTaskTag.call(self, task[0], task[1], c > 1 && task[1] == 0);
            if (c == 1 && task[1] == 0) {
                tag.style.fontSize = "";
            }
            tasks.append(tag);
        });
        document.documentElement.style.setProperty('--list-depth', info[1]);
    }

    function Show() {
        let view = document.getElementById('task-side');
        let btn = document.getElementById('ShowTaskSide');
        if (view.classList.contains('show')) {
            view.querySelectorAll('.task-pad').forEach(a => a.posX = a.posY = 0);
            view.classList.remove('show');
            btn.classList.remove('right-arrow');
        } else {
            if (view.querySelectorAll('.task-pad').length == 0) {
                view.append(taskPad.call(self));
            }
            view.classList.add('show');
            btn.classList.add('right-arrow');
        }
    }

    function showEditWindow(task) {
        let div = document.createElement('div');
        let pad = document.createElement('form');
        let rm = document.createElement('div');
        let btnList = document.createElement('div');
        let apply = document.createElement('span');
        let cancel = document.createElement('span');
        let reset = document.createElement('span');
        div.classList.add('fixed-fill');
        pad.classList.add('task-pad', 'fixed-center');
        rm.classList.add('rm-icon');
        btnList.classList.add('task-btn-container');
        apply.classList.add('task-btn', 'highlight');
        cancel.classList.add('task-btn');
        reset.classList.add('task-btn');
        apply.textContent = "Apply";
        cancel.textContent = "Delete";
        reset.textContent = "Reset";
        let dict = [
            ['Name', 'input', {type: 'text', required: 'true'}],
            ['Start', 'input', {type: 'date', required: 'true'}],
            ['End', 'input', {type: 'date', required: 'true'}],
            ['Description', 'textarea']
        ];
        let inputs = {};
        dict = dict.map((a, id) => {
            let label = document.createElement('label');
            let span = document.createElement('span');
            let ele = document.createElement(a[1]);
            span.textContent = a[0];
            Object.entries(a[2] || {}).forEach(i => ele.setAttribute(...i));
            label.append(span, ele);
            inputs[a[0]] = ele;
            return label;
        });
        btnList.append(apply, cancel, reset);
        inputs.End.min = inputs.Start.value;
        dict[1].querySelector('input[type="date"]').addEventListener('change', function(e) {
            dict[2].querySelector('input[type="date"]').min = this.value;
        });
        cancel.addEventListener('click', function(e) {
            setTimeout(function() {
                if (confirm("Are you sure you want to delete this task")) {
                    self.db.Delete(pad.dataset['index']);
                    div.remove();
                    self.Redraw();
                }
            }, 0);
        });
        apply.addEventListener('click', function() {
            if (pad.checkValidity()) {
                let origin = self.db.GetDataById(rm.parentElement.dataset['index']);
                let st = inputs.Start.valueAsDate, ed = inputs.End.valueAsDate;
                st = st.addMinutes(st.getTimezoneOffset());
                ed = ed.addMinutes(ed.getTimezoneOffset());
                origin.name = inputs.Name.value;
                origin.start_time = st;
                origin.end_time = ed;
                origin.description = inputs.Description.value;
                self.db.Update(origin);
                self.Redraw();
                div.remove();
            } else {
                pad.reportValidity();
            }
        });
        rm.addEventListener('click', function() {
            div.remove();
        });
        reset.addEventListener('click', function() {
            inputs.Name.value = task.name;
            inputs.Start.valueAsDate = new Date(task.start_time.toLocalISOString());
            inputs.End.valueAsDate = new Date(task.end_time.toLocalISOString());
            inputs.End.min = inputs.Start.value;
            inputs.Description.value = task.description;
        });
        pad.addEventListener('submit', function(e) {
            e.preventDefault();
        });
        reset.click();
        pad.dataset['index'] = task.id;
        pad.append(rm, ...dict, btnList);
        div.append(pad);
        document.body.append(div);
    }

    function showContextMenu(e, task) {
        let x = e.pageX, y = e.pageY;
        let ww = Math.max(document.documentElement.offsetWidth, window.innerWidth),
            wh = Math.max(document.documentElement.offsetHeight, window.innerHeight);
        let menu = document.createElement('div');
        let desc = document.createElement('span');
        let finish = document.createElement('span');
        let hr = document.createElement('hr');
        desc.textContent = task.description;
        finish.textContent = task.finish ? "Undone": "Finish";
        let edit = document.createElement('span');
        edit.textContent = "Edit";
        edit.addEventListener('click', function () {
            showEditWindow(task);
            menu.remove();
        });
        finish.addEventListener('click', function() {
            task.finish = !task.finish;
            let bar = document.querySelector(`.task-bar[data-index='${task.id}']`);
            if (task.finish) {
                bar.classList.add('task-finish');
            } else {
                bar.classList.remove('task-finish');
            }
            menu.remove();
        });
        window.addEventListener('mousedown', function (e) {
            if (!e.path.includes(menu)) {
                menu.remove();
            }
        });
        menu.classList.add('contextmenu');
        menu.append(desc, hr, finish);
        menu.append(edit);
        document.body.append(menu);
        let rect = menu.getBoundingClientRect();
        let mw = rect.width, mh = rect.height;
        if (mw + x > ww) {
            x = ww - x;
        }
        if (mh + y > wh) {
            y = wh - y;
        }
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
    }

    function AddPad() {
        let view = document.getElementById('task-side');
        view.append(taskPad.call(self));
    }

    tasks.addEventListener('dragover', function (e) {
        e.preventDefault();
    });

    tasks.addEventListener('drop', function (e) {
        let idx = e.dataTransfer.getData('text');
        let ele = document.querySelector(`#tasks-list span[data-index='${idx}']`);
        let data = self.db.GetDataById(idx);
        let pid = e.target.dataset['index'] || "0";
        if (idx != pid) {
            self.db.Delete(idx, false);
            data.pid = pid;
            data.start_time = data.start_time.toLocalISOString();
            data.end_time = data.end_time.toLocalISOString();
            self.db.Insert(data);
            self.Redraw();
        }
    });

    document.getElementById('task-side').addEventListener('wheel', function (e) {
        let mt = parseFloat(this.style.marginTop) || 0;
        mt -= e.deltaY;
        if (e.deltaY > 0) {
            let last = this.lastElementChild;
            let style = window.getComputedStyle(last);
            let nextY = ['marginTop', 'marginBottom'].reduce((a, b) => a + parseFloat(style[b]), 0) + last.bottom;
            if (nextY > window.innerHeight) {
                nextY -= e.deltaY;
                if (nextY < window.innerHeight) {
                    mt += window.innerHeight - nextY;
                }
            } else {
                mt += e.deltaY;
            }
        } else if (mt > 0) {
            mt = 0;
        }
        this.style.marginTop = mt + 'px';
        e.preventDefault();
    }, {passive: false});

    this.inject = function (nextDate) {
        nextDateFunc = nextDate;
    }
    this.Bind = Bind;
    this.List = List;
    this.Show = Show;
    this.Redraw = function () {
        self.List();
        self.AddTaskBar.call(dateCtrl, document.getElementById('tasks-view'));
    }
    this.AddFirstDateTask = AddFirstDateTask;
    this.AddLastDateTask = AddLastDateTask;
    this.AddTaskBar = AddTaskBar;

    this.AddPad = AddPad;
}

function DateController(taskController) {
    let self = this;
    let view = document.getElementById('tasks-view');
    let converter = new DateConverter('date');
    let preSize = null;
    let type = 'date';
    let curr_date = new Date();
    let lastDate, nextDate;
    let taskCtrl = taskController;
    this.OnLastChange = undefined;
    this.OnFirstChange = undefined;
    this.OnDateSwitch = undefined;

    function shiftDate(unit) {
        if (type == "date") {
            return (date) => Date.prototype.addDate.call(date, unit);
        } else if (type == "week") {
            return (date) => Date.prototype.addWeek.call(date, unit);
        } else if (type == "month") {
            return (date) => Date.prototype.addMonth.call(date, unit);
        }
    }

    function getColumn(date) {
        let task = document.createElement("div");
        let taskDate = document.createElement("div");
        let taskFill = document.createElement("div");
        task.classList.add('task', 'flex', 'flex-column');
        taskFill.classList.add('task-fill');
        task.append(taskFill);
        task.dataset["date"] = date.toLocalISOString();
        task.dataset["text"] = converter.GetString(date);
        return task;
    }

    function computeScaler(min, max) {
        let d1 = converter.GetDate(min);
        let d2 = nextDate(d1);
        let d3 = converter.GetDate(max);
        let d4 = nextDate(d3);
        function _(a, b, c) {
            a = a.getTime();
            b = b.getTime();
            c = c.getTime();
            return (a - b) / (c - b);
        }
        let minPos = _(min, d1, d2), maxPos = _(max, d3, d4);
        for (let x = max; d2 <= x; maxPos += 1, d2 = nextDate(d2));
        return [minPos, maxPos];
    }

    function insertLast(lTask) {
        let t = new Date(lTask.dataset["date"]);
        t = t.addMinutes(t.getTimezoneOffset());
        let st = nextDate(t);
        let last = getColumn.call(this, st);
        lTask.after(last);
        if (typeof(this.OnLastChange) === "function") {
            let ed = nextDate(st);
            this.OnLastChange.call(this, last, st, ed);
        }
        return last;
    }

    function removeFirst(fTask) {
        let next = fTask.nextElementSibling;
        if (next) {
            let unit = next.width;
            let items = fTask.querySelectorAll('.task-bar');
            let container = next.querySelector('.task-fill');
            for (let i = 0; i < items.length; i++) {
                let id = items[i].dataset['index'];
                let task = this.db.GetDataById(id);
                let min = new Date(next.dataset['date']), max = task.end_time;
                min = min.addMinutes(min.getTimezoneOffset());
                if (min < max) {
                    let new_pos = computeScaler(min, max);
                    items[i].style.marginLeft = unit * new_pos[0] + "px";
                    items[i].style.width = unit * (new_pos[1] - new_pos[0]) - 1 + "px";
                    container.append(items[i]);
                }
            }
        }
        fTask.remove();
    }

    function insertFirst(fTask) {
        let t = new Date(fTask.dataset["date"]);
        t = t.addMinutes(t.getTimezoneOffset());
        let st = lastDate(t);
        let first = getColumn.call(this, st);
        fTask.before(first);
        if (typeof(this.OnFirstChange) === "function") {
            this.OnFirstChange.call(this, first, st, t);
        }
        return first;
    }

    function insertTaskBar(view) {
        if (typeof(this.OnDateSwitch) === "function") {
            this.OnDateSwitch.call(this, view);
        }
    }

    function Bind(database) {
        this.db = database;
        curr_date = this.db.date ? new Date(this.db.date) : new Date();
    }

    function Switch(date) {
        curr_date = date ? new Date(date) : curr_date;
        date = converter.GetDate(curr_date);
        view.innerHTML = '';
        let c = 2 + parseInt(document.documentElement.getComputedValue('--show-count'));
        date = lastDate(date);
        let st = date;
        for (let i = 0; i < c; i++) {
            view.append(getColumn.call(this, date));
            date = nextDate(date);
        }
        let ed = date;
        let tasks = this.db.Query(function(task) {
            let t1 = task.start_time;
            let t2 = task.end_time;
            return st <= t1 && t1 < ed || st <= t2 && t2 < ed || t1 <= st && ed < t2;
        });
        preSize = view.firstElementChild.width;
        self.Offset = -preSize;
        insertTaskBar.call(self, view);
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
        self.Offset = x;
        let lTask = view.lastElementChild;
        while (lTask.right < xMax) {
            lTask = insertLast.call(self, lTask);
        }
        if (lTask.left - xMax > 20) {
            lTask.remove();
        }
    }

    function ZoomIn() {
        let c = parseInt(document.documentElement.getComputedValue('--show-count'));
        c -= 1;
        if (c < 1) c = 1;
        Update.call(self, c);
    }

    function ZoomOut() {
        let c = parseInt(document.documentElement.getComputedValue('--show-count'));
        c += 1;
        if (c > 10) c = 10;
        Update.call(self, c);
    }

    function Move() {
        let xMin = document.getElementById("tasks-list").right;
        let xMax = window.innerWidth;
        let x = view.posX;
        let fTask = view.firstElementChild;
        let lTask = view.lastElementChild;
        if ((xMin - fTask.right) > 20) {
            x += fTask.width;
            removeFirst.call(self, fTask);
            curr_date = nextDate(curr_date);
            insertLast.call(self, lTask);
        } else if ((lTask.left - xMax) > 20) {
            x -= lTask.width;
            lTask.remove();
            curr_date = lastDate(curr_date);
            insertFirst.call(self, fTask);
        }
        self.Offset = x;
    }

    function Init() {
        let offset = self.db.offset;
        self.Type = self.db.type;
        self.Switch();
        self.Offset = view.firstElementChild.width * offset;
    }

    Object.defineProperty(this, "Type", {
        get() {
            return type;
        },
        set(fmt) {
            if (["date", "week", "month"].includes(fmt)) {
                self.db.type = type = converter.Type = fmt;
                lastDate = shiftDate(-1);
                nextDate = shiftDate(+1);
                taskCtrl.inject(nextDate);
                offset = view.posX;
                self.Switch(curr_date);
                self.Offset = offset;
            }
        }
    });

    Object.defineProperty(this, "Offset", {
        get() {
            return view.posX;
        },
        set(v) {
            let w = view.firstElementChild.width;
            view.posX = v;
            self.db.offset = v / w;
        }
    });

    Object.defineProperty(this, "Date", {
        get() {
            return new Date(curr_date);
        }
    });

    view.drag({axis: 'x', callback: Move});

    document.getElementById('selectDate').addEventListener('click', function(e) {
        self.Type = "date";
    });
    document.getElementById('selectWeek').addEventListener('click', function(e) {
        self.Type = "week";
    });
    document.getElementById('selectMonth').addEventListener('click', function(e) {
        self.Type = "month";
    });

    window.addEventListener('resize', ()=>Update());

    this.computeScaler = computeScaler;
    this.Init = Init;
    this.Bind = Bind;
    this.Switch = Switch;
    this.Update = Update;
    this.ZoomIn = ZoomIn;
    this.ZoomOut = ZoomOut;
}

addEventListener('load', function() {
    let task = new TaskController();
    let date = new DateController(task);
    let data = new Database();
    if (localStorage['source']) {
        console.log('found local file');
        data.LoadLocal();
    } else {
        console.log('local file not found, load test file');
        data.Test();
    }
    date.OnLastChange = task.AddLastDateTask;
    date.OnFirstChange = task.AddFirstDateTask;
    date.OnDateSwitch = task.AddTaskBar;
    task.Bind(data, date);
    date.Bind(data);
    task.List();
    date.Init();

    document.getElementById('AddTaskPad').addEventListener('click', task.AddPad);
    document.getElementById('ShowTaskSide').addEventListener('click', task.Show);

    document.getElementById('increase').addEventListener('click', date.ZoomIn);
    document.getElementById('decrease').addEventListener('click', date.ZoomOut);

    document.getElementById('saveFile').addEventListener('click', ()=> {
        let str = data.Save(date.Date);
        let blob = new Blob([str], {type: "application/json;charset=utf-8"});
        let href = URL.createObjectURL(blob);
        let link = document.createElement('a');
        link.href = href;
        link.download = data.name.replace(/[\\/:?*|<>]/g, "_") + ".json";
        link.addEventListener('click', function(){
            setTimeout(function() {
                URL.revokeObjectURL(href);
                link.remove();
            }, 1000);
        });
        link.target = "_blank";
        link.click();
    });
    document.getElementById('openFile').addEventListener('change', function(){
        let file = this.files;
        if (file.length > 0) {
            let reader = new FileReader();
            reader.addEventListener('load', function(){
                let r = JSON.parse(this.result);
                data.Load(r);
                let x = data.offset;
                date.Switch(data.date);
                date.Offset *= -x;
                task.List();
            });
            reader.readAsText(file[0]);
        }
        this.value = "";
    });
    window.addEventListener('beforeunload', function () {
        localStorage['source'] = data.Save(date.Date);
    });
});
