/* ************************************************************************
* Title:    widgets.js
* Author:   Brandon Kemp
* Purpose:  Provide cool and functional wrapped DOM elements
************************************************************************ */

function hideElement__($e) {
    if (getComputedStyle($e).display === "none") {
        return;
    }

    $e._display = getComputedStyle($e).display;
    $e.style.display = "none";
}

function showElement__($e) {
    $e.style.display = $e._display || "block";
}

class CodeWidget {
    constructor(lengthArray, pc) {
        this.lengthArray = lengthArray;
        this.pc = pc;
        this.hilite = -1;
        this.$element = document.createElement("div");
        this.$element.className = "inputContainer";

        this.$lineNumbers = document.createElement("div");
        this.$lineNumbers.className = "lineNumbers";
        this.$element.appendChild(this.$lineNumbers);

        this.$input = document.createElement("textarea");
        this.$input.className = "input";
        this.$element.appendChild(this.$input);

        this.$input.addEventListener("input", this.updateLineNumbers.bind(this));
        this.$input.addEventListener("scroll", this.updateLineNumbers.bind(this));
    }

    updateLineNumbers() {
        var lines = this.$input.value.replace(/\r/g, "").split("\n");
    
        var ln = [];
    
        for (var i = 0; i < lines.length; i++) {
            if (this.hilite === i && lines[i] === "") {
                this.hilite++;
            }
            ln.push(this.hilite === i ?
                "<span class='lineNumbers-lineNumber lineNumbers-hilite'>" + i + "</span>"
                : "<span class='lineNumbers-lineNumber'>" + i + "</span>");
        }
    
        this.$lineNumbers.innerHTML = ln.join("<br>");
        this.$lineNumbers.scrollTop = this.$input.scrollTop;
    }

    update() {
        if (this.lengthArray.length > 0 && this.lengthArray[this.pc.value]) {
            // ok lets do it //
            this.hilite = this.lengthArray[this.pc.value].line;
        }

        this.updateLineNumbers();
    }

    get value() {
        return this.$input.value;
    }

    set value(s) {
        this.$input.value = s;
        this.updateLineNumbers();
    }
}

class MemoryWidget {
    constructor(memory, lengthArray, pc) {
        this.memory = memory;
        this.lengthArray = lengthArray;
        this.$element = document.createElement("div");
        this.$element.className = "memoryWidget";
        this.page = 0;
        this.pageLength = MemoryWidget.pageLength;
        this.pc = pc;
        
        this.$memory = document.createElement("div");
        this.$memory.className = "memoryWidget-memory";

        this.$pageUp = document.createElement("button");
        this.$pageDown = document.createElement("button");
        this.$pageUp.className = "memoryWidget-pageButton memoryWidget-pageUp";
        this.$pageDown.className = "memoryWidget-pageButton memoryWidget-pageDown";
        this.$pageUp.addEventListener("click", this.doPageUp.bind(this));
        this.$pageDown.addEventListener("click", this.doPageDown.bind(this));
        this.$pageUp.innerText = "▲";
        this.$pageDown.innerText = "▼";

        this.$element.appendChild(this.$memory);
        this.$element.appendChild(this.$pageUp);
        this.$element.appendChild(this.$pageDown);

        this.hlstart = 0;
        this.hlend = 1;
    }

    static get pageLength() {
        return 8;
    }

    update(updatePage) {
        if (updatePage === undefined) updatePage = true;
        if (updatePage) {
            this.doSetPage(parseInt(this.pc.value / (this.pageLength * 8)));
            return;
        }

        var goodByte = this.lengthArray.length > 0 && this.lengthArray[this.pc.value];

        this.hlstart = this.pc.value;
        this.hlend = goodByte ? this.pc.value + this.lengthArray[this.pc.value].length : this.hlstart + 1;

        //console.log(this.hlstart, this.hlend);

        var i = this.page * this.pageLength * 8;

        var str = this.memory.toString(this.page * this.pageLength, this.pageLength);
        str = str.replace(/\|/g, "");
        str = str.split("\n").map((str) => { 
            return str.substr(0, 4) + " <span class='fadedText'>" + str.substr(5).split(" ").map((b) => {
                /*switch (i++) {
                    case this.hlstart: return " <span class='activeBit'>" + b;
                    case this.hlend:   return "</span> " + b;
                    default:    return " " + b;
                }*/

                if (i >= this.hlstart && i < this.hlend) {
                    return (i++ === this.hlstart ? " <span class='activeBit'>" : "<span class='activeBit'> ") + b + "</span>";
                } else {
                    i++;
                    return " " + b;
                }
            }).join("") + "</span><br>";
        }).join("");

        this.$memory.innerHTML = str;
    }

    hide() {
        hideElement__(this.$element);
        //document.getElementById("gameContainer").style.bottom = "0";
    }

    show() {
        showElement__(this.$element);
        //document.getElementById("gameContainer").style.bottom = this.$element.offsetHeight + "px";
    }

    get numPages() {
        return this.memory.length / this.pageLength / 8;
    }

    doSetPage(page) {
        while (page < 0) {
            page += this.numPages;
        }

        this.page = page % this.numPages;
        this.update(false);
    }

    doPageUp() {
        this.doSetPage(--this.page);
    }

    doPageDown() {
        this.doSetPage(++this.page);
    }
}

class ShallowMemoryWidget {
    constructor(page, start) {
        // page is int8 array, start is start address (int16)
        this.page = page;
        this.start = new int16(start);
        this.pageLength = MemoryWidget.pageLength;

        this.$element = document.createElement("div");
        this.$element.className = "memoryWidget memoryWidget-shallow";
        
        this.$memory = document.createElement("div");
        this.$memory.className = "memoryWidget-memory memoryWidget-memory-shallow";

        this.$element.appendChild(this.$memory);
    }

    update() {
        var str = "";
        
        var rows = this.pageLength;

        for (var i = 0; i < rows; i++) {
            str += (this.start.value + 8 * i).toString(16).padStart(4, "0") + "<span class='fadedText'>";
            for (let j = 0; j < 8; j++) {
                str += " " + this.page[j + i * 8].toHexString().substr(1, 2);
            }
            str += "</span><br>";
        }

        this.$memory.innerHTML = str;
    }
}

class StatusBitsWidget {
    constructor(value) {
        this.$element = document.createElement("div");
        this.$element.className = "statusBitsWidget";

        this.value = coerceInt(value);

        this.$container = document.createElement("div");
        this.$container.className = "statusBitsWidget-container";
        this.$element.appendChild(this.$container);
    }

    update() {
        //SZ0X0P0C
        var s = [];

        if (this.value & 0b00000001) s.push("Carry");
        if (this.value & 0b00000100) s.push("Parity");
        if (this.value & 0b00010000) s.push("Auxiliary Carry");
        if (this.value & 0b01000000) s.push("Zero");
        if (this.value & 0b10000000) s.push("Sign");

        this.$container.innerText = s.join(", ") || "(None)";
    }
}

class RegisterContainerWidget {
    constructor() {
        this.$element = document.createElement("div");
        this.$element.className = "registerContainer";
        this.registerWidgets = {};
    }

    appendRegisterWidget(name, widget) {
        this.$element.appendChild(widget.$element);
        this.registerWidgets[name] = widget;
    }

    importRegisters(regs) {
        for (var regName in regs) {
            var w = new RegisterWidget(regs[regName], regName);
            this.appendRegisterWidget(regName, w);
        }
    }

    update() {
        for (var regName in this.registerWidgets) {
            this.registerWidgets[regName].update();
        }
    }

    hideRegister(name) {
        this.registerWidgets[name].hide();
    }

    showRegister(name) {
        this.registerWidgets[name].show();
    }
}

class RegisterWidget {
    constructor(registerAny, registerName, displayType) {
        this.register = registerAny;
        this.name = registerName;
        this.$element = document.createElement("div");
        this.$element.className = "registerWidget registerWidget-" + registerName;
        this.$header = document.createElement("div");
        this.$header.className = "registerWidget-header";
        this.$header.innerText = registerName;
        this.$header.addEventListener("click", this.showDisplayMenu.bind(this));
        this.$value = document.createElement("div");
        this.$value.className = "registerWidget-value";
        this.$element.appendChild(this.$header);
        this.$element.appendChild(this.$value);

        if (!settingsObject.hasOwnProperty("registerDisplayType")) {
            settingsObject.registerDisplayType = {
                A: "hex",
                B: "hex",
                C: "hex",
                D: "hex",
                E: "hex",
                H: "hex",
                L: "hex",
                BC: "hex",
                DE: "hex",
                HL: "hex",
                PSW: "hex",
                M: "hex",
                S: "bin",
                PC: "hex",
                SP: "hex"
            };
        }

        this.displayType = displayType || settingsObject.registerDisplayType[registerName];

        this.$displayMenu = document.createElement("div");
        this.$displayMenu.className = "registerWidget-displayMenu";
        this.$element.appendChild(this.$displayMenu);

        var addDisplay = (function(type) {
            var $m = document.createElement("div");
            $m._parent = this;
            $m._type = type;
            $m.className = "registerWidget-displayMenu-item";
            $m.innerText = type[0].toUpperCase() + type.substr(1);
            $m.addEventListener("click", (function() {
                this._parent.displayType = this._type;

                settingsObject.registerDisplayType[this._parent.name] = this._type;
                Storage.set("settings", settingsObject);

                this._parent.update();
                hideElement__(this.parentNode);
            }).bind($m));
            this.$displayMenu.appendChild($m);
        }).bind(this);

        addDisplay("decimal");
        addDisplay("binary");
        addDisplay("hex");

        hideElement__(this.$displayMenu);
    }

    update() {
        var s;

        switch (this.displayType) {
            case "bin":
            case "binary":
                s = this.register.toBinString();
                break;
            case "dec":
            case "decimal":
                s = this.register.toDecString();
                break;
            case "hex":
            case "hexidecimal":
            default:
                s = this.register.toHexString();
                break;
        }

        this.$value.innerText = s;
    }

    hide() {
        hideElement__(this.$element);
    }

    show() {
        showElement__(this.$element);
    }

    /*toggleDisplayType() {
        var s;

        switch (this.displayType) {
            case "bin":
            case "binary":
                s = "dec";
                break;
            case "dec":
            case "decimal":
                s = "hex";
                break;
            case "hex":
            case "hexidecimal":
            default:
                s = "bin";
                break;
        }
        
        this.displayType = s;
        this.update();
    }*/

    showDisplayMenu() {
        if (getComputedStyle(this.$displayMenu).display !== "none") {
            hideElement__(this.$displayMenu);
            return;
        }

        var x = widgets.findAll(".registerWidget-displayMenu");
        
        for (var i = 0; i < x.length; i++) {
            hideElement__(x[i]);
        }

        this.$displayMenu.style.top = this.$element.offsetTop + this.$element.offsetHeight;
        showElement__(this.$displayMenu);
    }
}

class ConsoleWidget {
    constructor() {
        this.$element = document.createElement("div");
        this.$element.className = "console";
    }

    clear() {
        this.$element.innerHTML = "";
    }

    printHTML(html) {
        var $msg = document.createElement("div");
        $msg.className = "console-msg";
        $msg.innerHTML = msg;
        this.$element.appendChild($msg);
        this.$element.scrollTop = this.$element.scrollHeight;
    }

    print(msg) {
        var $msg = document.createElement("div");
        $msg.className = "console-msg";
        $msg.innerText = msg;
        this.$element.appendChild($msg);
        this.$element.scrollTop = this.$element.scrollHeight;
    }

    log(msg) {
        this.print(msg);
    }

    error(msg) {
        var $msg = document.createElement("div");
        $msg.className = "console-msg console-err";
        $msg.innerText = msg;
        this.$element.appendChild($msg);
        this.$element.scrollTop = this.$element.scrollHeight;
    }

    err(msg) {
        this.error(msg);
    }

    warn(msg) {
        var $msg = document.createElement("div");
        $msg.className = "console-msg console-warning";
        $msg.innerText = msg;
        this.$element.appendChild($msg);
        this.$element.scrollTop = this.$element.scrollHeight;
    }

    warning(msg) {
        this.warn(msg);
    }
}

class WrapperWidget {
    constructor($e) {
        this.$element = $e;
        this.displayStyle = getComputedStyle($e).display;
    }

    hide() {
        hideElement__(this.$element);
    }

    show() {
        this.$element.style.display = this.displayStyle;
    }

    appendChild(...args) {
        this.$element.appendChild(...args);
    }

    appendWidget(widget) {
        this.$element.appendChild(widget.$element);
    }
}

class DiffWidget {
    constructor() {
        this.$element = document.createElement("div");
        this.$element.className = "diffWidget";
        this.widgets = [];

        this.$container = document.createElement("div");
        this.$container.className = "diffWidget-itemsContainer";
        this.$container.addEventListener("click", function(e) {
            e.stopPropagation();
        });
        this.$element.appendChild(this.$container);

        this.$element.addEventListener("click", this.hide.bind(this));
    }

    appendWidget(name, w) {
        var $c = document.createElement("div");
        $c.className = "diffWidget-itemContainer";
        var $h = document.createElement("div");
        $h.className = "diffWidget-itemHeader";
        $h.innerText = name;

        $c.appendChild($h);
        $c.appendChild(w.$element);

        this.$container.appendChild($c);
        this.widgets.push(w);

        w.update && w.update();
    }

    appendRegisterObject(name, obj) {
        // obj can either be registers or register-like int object //
        var r = new RegisterContainerWidget();
        r.importRegisters(obj);
        this.appendWidget(name, r);
    }

    appendMemoryBlob(name, blob, start) {
        var arr = [];

        for (var i = 0; i < 8 * MemoryWidget.pageLength; i++) {
            arr[i] = new int8(blob[i + start.value]);
        }

        var w = new ShallowMemoryWidget(arr, start);
        this.appendWidget(name, w);
    }

    appendMemoryPage(name, memory, page) {
        var w = new ShallowMemoryWidget(memory.toInt8Array(page * MemoryWidget.pageLength, MemoryWidget.pageLength), page * MemoryWidget.pageLength * 8);
        this.appendWidget(name, w);
    }

    appendMemoryPageFromRoot(name, memory, root) {
        root = coerceInt(root);
        var w = new ShallowMemoryWidget(memory.toInt8Array(root / 8, MemoryWidget.pageLength), root);
        this.appendWidget(name, w);
    }

    update() {
        for (var i = 0; i < this.widgets.length; i++) {
            this.widgets[i].update && this.widgets[i].update();
        }
    }

    show() {
        showElement__(this.$element);
    }

    hide() {
        hideElement__(this.$element);
    }

    clear() {
        this.$container.innerHTML = "";
        array_clear(this.widgets);
    }
}

class ReferenceWidget {
    constructor(reference) {
        this.reference = reference;

        this.$element = document.createElement("div");
        this.$element.className = "ref-widget";

        this.$search = document.createElement("input");
        this.$search.type = "text";
        this.$search.placeholder = "Search...";
        this.$search.className = "refs-search";
        this.$search.addEventListener("input", this.doSearch.bind(this));
        this.$element.appendChild(this.$search);

        this.$container = document.createElement("div");
        this.$container.className = "refs-container";
        this.$element.appendChild(this.$container);

        this.$close = document.createElement("button");
        this.$close.className = "ref-widget-close";
        //this.$close.innerText = "X";
        this.$close.addEventListener("click", this.hide.bind(this));
        this.$container.appendChild(this.$close);

        this.$openNew = document.createElement("button");
        this.$openNew.className = "ref-widget-openNew";
        //this.$openNew.innerText = "↗️";
        this.$openNew.addEventListener("click", this.doOpenNew.bind(this));
        this.$container.appendChild(this.$openNew);

        for (var op in this.reference.doc) {
            let $r = this.reference.genOpElement(op);
            this.$container.appendChild($r);
        }
    }

    show(op) {
        showElement__(this.$element);/*
        if (op) {
            op = op.toUpperCase();
            var refs = widgets.findAll(".ref-container");
            for (var i = 0; i < refs.length; i++) {
                refs[i].style.display = "none";
            }

            widgets.find(".ref-" + op).style.display = "block";
        } else {
            var refs = widgets.findAll(".ref-container");
            for (var i = 0; i < refs.length; i++) {
                refs[i].style.display = "block";
            }
        }*/

        if (op) {
            op = op.toUpperCase();
            this.$container.scrollTop = widgets.find(".ref-" + op).offsetTop - 8;
            widgets.find(".ref-" + op).classList.add("ref-focused");
        }
    }

    hide() {
        hideElement__(this.$element);
        var w = widgets.find(".ref-focused", true);
        if (w) {
            w.classList.remove("ref-focused");
        }

        this.$search.value = "";
        this.doSearch();
    }

    doSearch() {
        var terms = this.$search.value.toLowerCase()
            .replace(/\&/g, " ").split("|").map(orcase => orcase.trim().split(" "));
        
        for (var op in this.reference.doc) {
            var s = this.reference.genSearchableString(op);
            var $e = widgets.find(".ref-" + op);

            if (terms.some(t => t.every(term => term[0] === "!" ? s.indexOf(term.substr(1)) === -1 : s.indexOf(term) !== -1))) {
                showElement__($e);
            } else {
                hideElement__($e);
            }
        }
    }

    doOpenNew() {
        window.open("?ref");
    }
}

class SmallReferenceWidget {
    constructor(referenceWidget) {
        this.reference = referenceWidget.reference;
        this.referenceWidget = referenceWidget;
        this.currentOp = null;
        this.$currentOp = null;

        this.$element = document.createElement("div");
        this.$element.className = "ref-small-widget";
        this.$element.addEventListener("click", this.hide.bind(this));

        this.$container = document.createElement("div");
        this.$container.className = "refs-small-container";
        this.$container.addEventListener("click", function(e) {
            e.stopPropagation();
        });
        this.$element.appendChild(this.$container);

        this.$openLink = document.createElement("button");
        this.$openLink.className = "refs-small-openLink";
        this.$openLink.innerText = "Open in Ref";
        this.$openLink.addEventListener("click", this.doOpenLink.bind(this));
        this.$container.appendChild(this.$openLink);
    }

    show(op) {
        showElement__(this.$element);
        op = op.toUpperCase();
        this.currentOp = op;
        this.$currentOp = this.reference.genOpElement(op);
        this.$container.prepend(this.$currentOp);
    }

    hide() {
        hideElement__(this.$element);
        this.$currentOp && this.$container.removeChild(this.$currentOp);
    }

    doOpenLink() {
        this.referenceWidget.show(this.currentOp);
        this.hide();
    }
}

class ChallengeListContainerWidget {
    constructor() {
        this.$element = document.createElement("div");
        this.$element.className = "challengeListContainerWidget";

        this.$selector = document.createElement("div");
        this.$selector.className = "challengeListContainerWidget-selector";
        this.$element.appendChild(this.$selector);

        this.$container = document.createElement("div");
        this.$container.className = "challengeListContainerWidget-container";
        this.$element.appendChild(this.$container);

        this.currentPage = "";
        this.pages = {};
        this.length = 0;
    }

    clear() {
        this.pages = {};
        this.length = 0;
        this.$container.innerHTML = "";
        this.$selector.innerHTML = "";
    }

    appendChallenge(challenge) {
        var category = challenge.category;

        if (!this.pages.hasOwnProperty(category)) {
            var $s = document.createElement("div");
            $s.className = "challengeListContainerWidget-selector-button";
            $s.id = "challengeListContainerWidget-selector-button-" + category;
            $s.innerText = category;
            $s.addEventListener("click", (function() {
                this.switchToPage(category);
            }).bind(this));
            this.$selector.appendChild($s);

            this.pages[category] = new ChallengeListWidget(category);
            this.length++;

            if (this.length === 1) {
                this.switchToPage(category);
            }
        }

        this.pages[category].appendChallenge(challenge);
    }

    switchToPage(category) {
        this.currentPage = category;
        this.$container.innerHTML = "";
        this.$container.appendChild(this.pages[category].$element);

        var s = widgets.findAll(".challengeListContainerWidget-selector-button");

        for (var i = 0; i < s.length; i++) {
            s[i].classList.remove("active");
        }

        widgets.find("#challengeListContainerWidget-selector-button-" + category, true).classList.add("active");

        this.$element.parentNode.style["background-image"] = "url('./img/bgs/" + category + ".jpg";
    }

    hide() {
        hideElement__(this.$element);
        //document.getElementById("gameContainer").style.bottom = "0";
    }

    show() {
        showElement__(this.$element);
        //document.getElementById("gameContainer").style.bottom = this.$element.offsetHeight + "px";
    }
}

class ChallengeListWidget {
    constructor(category) {
        this.category = category;

        this.$element = document.createElement("div");
        this.$element.className = "challengeListWidget"

        this.$header = document.createElement("div");
        this.$header.className = "challengeListWidget-header";
        this.$header.innerText = category.toUpperCase();
        this.$element.appendChild(this.$header);

        this.$container = document.createElement("div");
        this.$container.className = "challengeListWidget-container";
        this.$element.appendChild(this.$container);
    }

    appendChallenge(challenge) {
        var $e = document.createElement("div");
        $e.className = "challenge";

        if (!challengeStatusObject.hasOwnProperty(challenge.name)) {
            challengeStatusObject[challenge.name] = {
                success: false,
                solution: "",
                new: true
            };
        }

        if (challengeStatusObject[challenge.name].success) {
            $e.className += " complete";
        }

        $e.innerText = challenge.title;
        $e.id = "challenge-" + challenge.name;
        $e.addEventListener("click", Challenge.elementInvoke.bind(challenge));

        if (challengeStatusObject[challenge.name].new) {
            var $n = document.createElement("div");
            $n.className = "new";
            $n.id = "new-" + challenge.name;
            $n.innerText = "New!";
            $e.appendChild($n);
        }
        
        this.$container.appendChild($e);
    }
}