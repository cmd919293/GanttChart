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
        let v1 = t1.getTime(), v2 = t2.getTime();
        Query.call(this, function (a) {
            return a.pid == task.id;
        }).forEach(function (val) {
            let x = val.min_date().getTime();
            let y = val.max_date().getTime();
            if (x < v1) {
                v1 = x;
                t1 = val.min_date;
            }
            if (v2 < y) {
                v2 = y;
                t2 = val.max_date;
            }
        });
        for (let tmp = this.source[pid], flag = true; flag && tmp; tmp = this.source[tmp.pid]) {
            flag = false;
            let t3 = tmp.min_date.getTime();
            let t4 = tmp.max_date.getTime();
            if (v1 < t3) {
                flag = true;
                tmp.min_date = t1;
            }
            if (t4 < v2) {
                flag = true;
                tmp.max_date = t2;
            }
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

    function Test() {
        Load.call(this, JSON.parse('{"name":"Test1","date":"2019-12-25T00:00:00.000Z","tasks":[{"id":1,"name":"aaa","start_time":"2019-12-23T00:00:00.000Z","end_time":"2019-12-24T00:00:00.000Z","description":"this is a task named aaa","pid":0},{"id":2,"name":"ccc","start_time":"2019-12-23T00:00:00.000Z","end_time":"2019-12-26T00:00:00.000Z","description":"this is a task named ccc","pid":0},{"id":3,"name":"bbb","start_time":"2019-12-23T00:00:00.000Z","end_time":"2019-12-25T00:00:00.000Z","description":"this is a task named bbb","pid":1},{"id":4,"name":"ddd","start_time":"2019-12-24T00:00:00.000Z","end_time":"2019-12-25T00:00:00.000Z","description":"this is a task named ddd","pid":2}]}'));
    }

    this.Load = Load;
    this.Insert = Insert;
    this.Query = Query;
    this.Save = Save;
    this.Test = Test;
}

function TaskController() {
    let self = this;
    let tasks = document.getElementById('tasks-list');

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
        ele.dataset["start"] = task.start_time.toISOString();
        ele.dataset["end"] = task.end_time.toISOString();
        ele.dataset["min"] = task.min_date.toISOString();
        ele.dataset["max"] = task.max_date.toISOString();
        ele.dataset["index"] = task.id;
        ele.dataset["pid"] = task.pid;
        return ele;
    }

    function getTaskBar(task, left, right) {
        // TODO
    }

    function AddLastDateTask(container, st, ed) {
        if (self.db) {
            let st_time = st.getTime();
            let ed_time = ed.getTime();
            container = container.querySelector('.task-fill');
            let tasks = self.db.Query(function(task) {
               let t1 = task.start_time.getTime();
               return st_time <= t1 && t1 < ed_time;
            });
            for (let i = 0; i < tasks.length; i++) {
                let task = tasks[i];
                container.append(getTaskBar(task, st, ed));
            }
        }
    }

    function AddFirstDateTask(container, st, ed) {
        if (self.db) {
            let st_time = st.getTime();
            let ed_time = ed.getTime();
            container = container.querySelector('.task-fill');
            let tasks = self.db.Query(function(task) {
                let t1 = task.start_time.getTime();
                // TODO
                return st <= t1 && t1 < ed;
            });
            for (let i = 0; i < tasks.length; i++) {
                let task = tasks[i];
                container.append(getTaskBar(task));
            }
        }
    }

    function Bind(database) {
        this.db = database;
    }

    function List() {
        document.title = this.db.name;
        tasks.innerHTML = "";
        this.db.Query(()=>!0).forEach(function(task) {
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
        task.dataset["date"] = date.toISOString();
        return task;
    }

    function insertLast(lTask) {
        let t = new Date(lTask.dataset["date"]);
        let st = nextDate(t);
        let last = getColumn.call(this, st);
        lTask.after(last);
        if (typeof(this.OnLastChange) === "function") {
            let ed = nextDate(st);
            this.OnLastChange.call(this, last, st, ed);
        }
    }

    function insertFirst(fTask) {
        let t = new Date(fTask.dataset["date"]);
        let st = lastDate(t);
        let first = getColumn.call(this, st);
        fTask.before(first);
        if (typeof(this.OnFirstChange) === "function") {
            this.OnFirstChange(this, first, st, t);
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
        st_time = date.getTime();
        for (let i = 0; i < c; i++) {
            view.append(getColumn.call(this, date));
            date = nextDate(date);
        }
        ed_time = date.getTime();
        let tasks = this.db.Query(function(task) {
            let t1 = task.start_time.getTime();
            let t2 = task.end_time.getTime();
            return st_time <= t1 && t1 < ed_time || st_time <= t2 && t2 < ed_time || t1 <= st_time && ed_time < t2;
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
            fTask.remove();
            curr_date = nextDate(curr_date);
            insertLast(lTask);
        } else if ((lTask.left - xMax) > 20) {
            x -= lTask.width;
            lTask.remove();
            curr_date = lastDate(curr_date);
            insertFirst(fTask);
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
