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
    this.source = {};
    this.tree = {};

    function Load(obj) {
        let tasks = obj.tasks;
        this.name = obj.name;
        this.date = obj.date;
        this.source = {};
        for (let i = 0; i < tasks.length; i++) {
            Insert.call(this, tasks[i]);
        }
    }

    function Save(date) {
        return JSON.stringify({
            "name": this.name,
            "date": date ? new Date(date) : new Date(),
            "tasks": Object.entries(this.source).map(a => {
                let x = a[1];
                return ["id", "name", "start_time", "end_time", "description", "pid"].reduce((a, b)=>{
                    a[b] = x[b];
                    return a
                }, {});
            })
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
            "description": task.description,
            "pid": pid
        }
    }

    function Insert(task, pid) {
        let id = task.id || this.index;
        if (!this.source[id]) {
            let obj = create.call(this, task, id, task.pid || 0);
            Update.call(this, obj);
            this.index = id + 1;
        }
        return id;
    }

    function Update(task) {
        let obj = this.source[task.id] || task;
        let pid = obj.pid || 0;
        let t1 = obj.min_date, t2 = obj.max_date;
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
        let path = [];
        for (let tmp = this.source[pid], flag = true;tmp; tmp = this.source[tmp.pid]) {
            path.unshift(tmp.id);
            if (flag) {
                flag = false;
                let t3 = tmp.min_date;
                let t4 = tmp.max_date;
                if (t1 < t3) {
                    flag = true;
                    tmp.min_date = t1;
                }
                if (t4 < t2) {
                    flag = true;
                    tmp.max_date = t2;
                }
            }
        }
        let tree = this.tree;
        for (let i = 0; i < path.length; i++) {
            tree = tree[this.source[path[i]].id];
        }
        if (!tree[obj.id]) {
            tree[obj.id] = {};
        }
        this.source[obj.id] = obj;
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
        function _(tree) {
            for (let i in tree) {
                tasks.push(this.source[i]);
                _.call(this, tree[i]);
            }
        }
        _.call(this, this.tree);
        return tasks;
    }

    function Test() {
        Load.call(this, {
            "name":"Test1",
            "date":"2020-01-07T00:00:00.000Z",
            "tasks":[
                {"id":1,"name":"aaa","start_time":"2019-12-23T00:00:00.000Z","end_time":"2019-12-23T00:00:00.000Z","description":"this is a task named aaa","pid":0},
                {"id":2,"name":"bbb","start_time":"2019-12-23T00:00:00.000Z","end_time":"2019-12-24T00:00:00.000Z","description":"this is a task named bbb","pid":0},
                {"id":3,"name":"ccc","start_time":"2019-12-24T00:00:00.000Z","end_time":"2019-12-27T00:00:00.000Z","description":"this is a task named ccc","pid":0},
                {"id":4,"name":"ddd","start_time":"2019-12-23T00:00:00.000Z","end_time":"2019-12-27T00:00:00.000Z","description":"this is a task named ddd","pid":0},
                {"id":5,"name":"eee","start_time":"2019-12-23T00:00:00.000Z","end_time":"2019-12-31T00:00:00.000Z","description":"this is a task named eee","pid":0}
            ]});
    }

    this.Load = Load;
    this.TaskTree = TaskTree;
    this.Insert = Insert;
    this.Query = Query;
    this.Save = Save;
    this.Test = Test;
}

function TaskController() {
    let self = this;
    let tasks = document.getElementById('tasks-list');
    let converter = new DateConverter('date');

    function taskPad() {
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

    function getTaskTag(task) {
        let ele = document.createElement('span');
        ele.dataset["taskName"] = task.name;
        ele.dataset["start"] = task.start_time.toLocalISOString();
        ele.dataset["end"] = task.end_time.toLocalISOString();
        ele.dataset["min"] = task.min_date.toLocalISOString();
        ele.dataset["max"] = task.max_date.toLocalISOString();
        ele.dataset["index"] = task.id;
        ele.dataset["pid"] = task.pid;
        return ele;
    }

    function getTaskBar(task, unit, left, right) {
        let min = task.min_date, max = task.max_date;
        if (min < left) {
            min = left;
        }
        let position = this.computeScaler(min, max);
        let first = document.querySelector("#tasks-list > span:first-of-type");
        let top = document.querySelector(`span:not(.task-bar)[data-index='${task.id}']`);
        top = top.offsetTop - top.height + (top == first ? 3 : 1);
        let div = document.createElement('div');
        div.classList.add('task-bar');
        div.style.marginLeft = unit * position[0] + "px";
        div.style.width = unit * (position[1] - position[0]) - 1 + "px";
        div.style.top = top + 'px';
        div.dataset['index'] = task.id;
        div.dataset['name'] = task.name;
        div.dataset['min'] = task.min_date.toLocalISOString();
        div.dataset['max'] = task.max_date.toLocalISOString();
        return div;
    }

    function AddLastDateTask(container, st, ed) {
        if (self.db) {
            container = container.querySelector('.task-fill');
            let tasks = self.db.Query(function(task) {
               let t1 = task.min_date;
               return st <= t1 && t1 < ed;
            });
            for (let i = 0; i < tasks.length; i++) {
                let task = tasks[i];
                container.append(getTaskBar.call(this, task, container.parentElement.width, st, ed));
            }
        }
    }
    
    function AddTaskBar(container, st, ed) {
        if (self.db) {
            let size = container.width;
            let view = container.parentElement;
            container = container.querySelector('.task-fill');
            let task = self.db.Query(function(task) {
                let t1 = task.min_date;
                let t2 = task.max_date;
                return st <= t1 && t1 < ed || st < t2 && t2 <= ed;
            })
        }
    }

    function AddFirstDateTask(container, st, ed) {
        if (self.db) {
            let next = container.nextElementSibling.querySelectorAll('.task-fill > .task-bar');
            let size = container.width;
            container = container.querySelector('.task-fill');
            let tasks = self.db.Query(function(task) {
                let t1 = task.min_date;
                let t2 = task.max_date;
                if (st.getTime() == t1.getTime() && t1.getTime() == t2.getTime()) {
                    return true;
                } else {
                    return st < t2 && t2 <= ed && t1.getTime() != t2.getTime();
                }
            });
            for (let i = 0; i < tasks.length; i++) {
                let task = tasks[i];
                container.append(getTaskBar.call(this, task, size, st, ed));
            }
            for (let i = 0; i < next.length; i++) {
                let bar = next[i];
                let cur = this.db.source[bar.dataset['index']];
                if (cur.min_date < ed) {
                    next[i].remove();
                    container.append(getTaskBar.call(this, cur, size, st, ed));
                }
            }
        }
    }

    function Bind(database) {
        this.db = database;
    }

    function List() {
        document.title = this.db.name;
        tasks.innerHTML = "";
        this.db.TaskTree().forEach(function(task) {
            tasks.append(getTaskTag.call(self, task));
        })
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

    function PadTest(n=2) {
        let view = document.getElementById('task-side');
        for(let i = 0; i < n; i++) {
            view.append(taskPad.call(self));
        }
    }

    this.Bind = Bind;
    this.List = List;
    this.Show = Show;
    
    this.AddFirstDateTask = AddFirstDateTask;
    this.AddLastDateTask = AddLastDateTask;

    this.AddPad = PadTest;
}

function DateController() {
    let self = this;
    let view = document.getElementById('tasks-view');
    let converter = new DateConverter('date');
    let preSize = null;
    let type = 'date';
    let curr_date = new Date();
    let lastDate, nextDate;
    this.OnLastChange = undefined;
    this.OnFirstChange = undefined;
    
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
        taskDate.classList.add('task-date');
        taskFill.classList.add('task-fill');
        taskDate.dataset["date"] = converter.GetString(date);
        task.append(taskDate, taskFill);
        task.dataset["date"] = date.toLocalISOString();
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
    }
    
    function removeFirst(fTask) {
        let next = fTask.nextElementSibling;
        if (next) {
            let unit = next.width;
            let items = fTask.querySelectorAll('.task-bar');
            let container = next.querySelector('.task-fill');
            for (let i = 0; i < items.length; i++) {
                let id = items[i].dataset['index'];
                let task = this.db.source[id];
                let min = new Date(next.dataset['date']), max = task.max_date;
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
        let lTask = view.lastElementChild;
        if ((lTask.right - xMax) < 100) {
            insertLast(lTask);
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
            removeFirst.call(self, fTask);
            curr_date = nextDate(curr_date);
            insertLast.call(self, lTask);
        } else if ((lTask.left - xMax) > 20) {
            x -= lTask.width;
            lTask.remove();
            curr_date = lastDate(curr_date);
            insertFirst.call(self, fTask);
        }
        view.posX = x;
    }

    Object.defineProperty(this, "Type", {
        get() {
            return type;
        },
        set(fmt) {
            if (["date", "week", "month"].includes(fmt)) {
                type = fmt;
                converter.Type = fmt;
                lastDate = shiftDate(-1);
                nextDate = shiftDate(+1);
            }
        }
    });

    Object.defineProperty(this, "Date", {
        get() {
            return new Date(curr_date);
        }
    });

    view.drag({axis: 'x', callback: Move});

    document.getElementById('DateFormat').addEventListener('change', function(e) {
        let x = ["date", "week", "month"][this.valueAsNumber];
        let d = view.firstElementChild.dataset["date"];
        d = nextDate(d);
        offset = view.posX;
        self.Type = x;
        self.Switch(curr_date);
        view.posX = offset;
    });

    window.addEventListener('resize', ()=>Update());

    this.computeScaler = computeScaler;
    this.Bind = Bind;
    this.Switch = Switch;
    this.Update = Update;
    this.Type = "date";
}

addEventListener('load', function() {
    let task = new TaskController();
    let date = new DateController();
    let data = new Database();
    data.Test();
    task.Bind(data);
    date.Bind(data);
    date.Switch();
    task.List();
    task.AddPad(5);
    date.OnLastChange = task.AddLastDateTask;
    date.OnFirstChange = task.AddFirstDateTask;
    document.getElementById('ShowAddTask').addEventListener('click', task.Show);
    document.getElementById("numTasks").addEventListener('change', function(e) {
        date.Update(e.target.valueAsNumber);
    });
    document.getElementById('exitApp').addEventListener('click', ()=>window.close());
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
                date.Switch(data.date);
                task.List();
            });
            reader.readAsText(file[0]);
        }
    });
});
