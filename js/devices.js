/* ************************************************************************
* Title:    devices.js
* Author:   Brandon Kemp
* Purpose:  Devices!! are cool
************************************************************************ */

class IODevice {
    constructor(processor) {
        this.processor = processor;
    }

    sendByte(byte) {
        byte = new int8(byte);
    }

    requestByte() {
        return new int8(0);
    }
}

class IO_SumRequester extends IODevice {
    constructor(processor) {
        super(processor);
        this.bytesToSend = [
            int8.random(),
            int8.random()
        ];
        this.bytesSent = 0;
        this.lastReceived = null;
        
        this.$element = document.createElement("div");
        this.$element.className = "device sumRequester";

        this.$inner = document.createElement("div");
        this.$inner.className = "sumRequester-inner";
        this.$element.appendChild(this.$inner);

        this.$inner.innerText = this.bytesToSend.map(i8 => i8.toDecString()).join(" ");

        this.$sum = document.createElement("div");
        this.$sum.className = "sumRequester-sum";
        this.$sum.innerText = "Sum: -";
        this.$element.appendChild(this.$sum);
    }

    reset() {
        this.bytesToSend = [
            int8.random(),
            int8.random()
        ];
        this.bytesSent = 0;
        this.lastReceived = null;
        this.$inner.innerText = this.bytesToSend.map(i8 => i8.toDecString()).join(" ");
        this.$sum.innerText = "Sum: -";
    }

    sendByte(byte) {
        this.lastReceived = byte.copy();
        this.$sum.innerText = "Sum: " + byte.toDecString();
    }

    requestByte() {
        if (this.bytesSent < 2) {
            return this.bytesToSend[this.bytesSent++].copy();
        } else {
            return new int8(0);
        }
    }
}