/* ************************************************************************
* Title:    challengebase.js, challenge.js
* Author:   Brandon Kemp
* Purpose:  Provide interface for challenges,
            challenges are built into this file by build.js
************************************************************************ */

/* ideas

text
screen
brainfuck interpreter

*/

class Challenge {
    constructor(name, title, category, desc, prereqs, unlocks, requiredRegs, tests, invokeFn, setupFn, testFn, getExpectedFn, diffFn) {
        this.title = title;
        this.name = name;
        this.category = category;
        this.prereqs = prereqs;
        this.unlocks = unlocks;
        this.desc = desc;
        this.tests = tests;
        this.requiredRegs = requiredRegs;
        this.invokeFn = invokeFn.bind(this);
        this.testFn = testFn.bind(this);
        this.getExpectedFn = getExpectedFn.bind(this);
        this.setupFn = setupFn.bind(this);
        this.diffFn = diffFn.bind(this);
    }

    invoke() {
        challengeStatusObject[this.name].new = false;
        widgets.find("#challengeText").innerHTML = "<div>" + this.desc.replace(/\<op\>(.+?)\<\/op\>/g, "<code class='clickable-op' onclick='widgets.smallReference.show(\"$1\");'>$1</code>") + "</div>";
        if (this.requiredRegs.length > 0 && this.requiredRegs[0] !== "all") {
            for (var regName in processor.registers) {
                if (this.requiredRegs.indexOf(regName) === -1) {
                    widgets.registerContainer.hideRegister(regName);
                } else {
                    widgets.registerContainer.showRegister(regName);
                }
            }
        } else {
            for (var regName in processor.registers) {
                widgets.registerContainer.showRegister(regName);
            }
        }
        this.invokeFn();
    }

    static regDiff(diffWidget, oldBlob, expectedBlob) {
        //window.god = oldBlob;
        diffWidget.appendRegisterObject("Input Registers", oldBlob.registers);
        diffWidget.appendRegisterObject("Expected Registers", expectedBlob.registers);
        diffWidget.appendRegisterObject("Your Registers", processor.matchRegisters(expectedBlob.registers));
    }

    static memDiff(diffWidget, oldBlob, expectedBlob) {
        /*console.log("old", oldBlob, 
        "expected", expectedBlob,
        "current", processor.memory.toBlob());*/
        //console.log(this, this.newRoot);
        /*console.log("old", oldBlob.memoryBlob);
        console.log("expected", expectedBlob.memoryBlob);
        console.log("current", processor.memory.toBlob());*/
        diffWidget.appendMemoryBlob("Input Memory", oldBlob.memoryBlob, this.root);
        diffWidget.appendMemoryBlob("Expected Memory", expectedBlob.memoryBlob, this.newRoot);
        diffWidget.appendMemoryPageFromRoot("Your Memory", processor.memory, this.newRoot);
    }

    static statusDiff(diffWidget, oldBlob, expectedBlob) {
        diffWidget.appendRegisterObject("Input Registers", oldBlob.registers);
        diffWidget.appendWidget("Expected Status Bits", new StatusBitsWidget(expectedBlob.registers.S.value));
        diffWidget.appendWidget("Your Status Bits", new StatusBitsWidget(processor.registers.S.value));
    }

    static statusDiffWithReg(diffWidget, oldBlob, expectedBlob) {
        diffWidget.appendRegisterObject("Input Registers", oldBlob.registers);
        diffWidget.appendWidget("Expected Status Bits", new StatusBitsWidget(expectedBlob.registers.S.value));
        diffWidget.appendWidget("Your Status Bits", new StatusBitsWidget(processor.registers.S.value));
        diffWidget.appendRegisterObject("Your Registers", processor.matchRegisters(expectedBlob.registers));
    }

    runTest(processor, cb) {
        processor.clear(true);
        doAssemble(true);
        var plength = processor.programLength;
        var memCache = array_copy(processor.memory.array);

        var time = [0,0,0,0,0];

        var i = 0;

        var success = false;

        var test = (function(cb2) {
            processor.clear(true);
            processor.memory.array = array_copy(memCache);
            processor.programLength = plength;
            this.setupFn(processor, i);
            var oldBlob = processor.toBlob();

            var after = (function(z) {
                if (z.error) {
                    return {
                        error: z.error
                    };
                }
    
                var newBlob = processor.toBlob();
    
                success = this.testFn(oldBlob, newBlob);
    
                if (!success) {
                    cb({
                        success: false,
                        oldBlob: oldBlob,
                        newBlob: newBlob
                    });
                }

                cb2();
            }).bind(this);

            processor.execute(after);
        }).bind(this);

        var timer = setInterval((function() {
            test((function() {
                if (!success) {
                    clearInterval(timer);
                }

                if (++i === this.tests) {
                    clearInterval(timer);

                    if (!challengeStatusObject.unlocked) {
                        challengeStatusObject.unlocked = [];
                    }

                    for (var i_ = 0; i_ < this.unlocks.length; i_++) {
                        let unlock = this.unlocks[i_];
                        if (challengeStatusObject.unlocked.indexOf(unlock) === -1) {
                            challengeStatusObject.unlocked.push(unlock);
                        }
                    }

                    Storage.set("challengeStatus", challengeStatusObject);

                    var currentPage = widgets.challengeListContainer.currentPage;
                    populateChallengeContainer();
                    widgets.challengeListContainer.switchToPage(currentPage);

                    cb({
                        success: true
                    });
                }
            }).bind(this));
        }).bind(this), 1);
    }

    static elementInvoke() {
        widgets.challengeListContainer.hide();
        widgets.workspaceContainer.show();
        processor.reset();
        widgets.console.clear();
        widgets.code.value = challengeStatusObject[this.name].solution;
        updateWidgets();
        currentChallenge = this;
        this.invoke();
    }
}

var challenges = []; // will be built from challenges.cdoc

function populateChallengeContainer() {
    widgets.challengeListContainer.clear();

    if (!challengeStatusObject.unlocked) {
        challengeStatusObject.unlocked = [];
    }

    var unlocked = challengeStatusObject.unlocked;

    for (var i = 0 ; i < challenges.length; i++) {
        let prereqs = challenges[i].prereqs;

        if (prereqs.every(prereq => unlocked.indexOf(prereq) !== -1)) {
            widgets.challengeListContainer.appendChallenge(challenges[i]);
        }
    }

    Storage.set("challengeStatus", challengeStatusObject);
}