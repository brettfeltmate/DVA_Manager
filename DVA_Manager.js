/*

DVA_Manager class definition
Brett Feltmate & Jon Mulle 2020

see README.md for detailed instructions

 */


const sum = (a, b) => a + b;

class DVAManager {
    constructor() {
        // Find size, in deg, of the to-be-measured item as a function of its distance from the user
        this.reference = {
            object: {
                width: {
                    px: null,
                    degrees: null,
                    radians: null,
                    mm: 86
                }
            },
            element: {
                width: {
                    initial: null,
                    computed: null
                },
                height: {
                    initial: null,
                    computed: null
                },
                initial_margin: null,
            }
        };

        this.DOM = {
            reference: {
                box: null,
                resize_handle: null,
            },
            instructions: {
                box: null,
            },
            tutorial: {
                card: null,
                text: null,
                image: null,
                progress: null
            },
        };

        this.one_dva = null;
        this.aspect_ratio = null;
        this.view_distance = 280; // mm, this is a constant
        this.scale = null;
        this.dragging = false;
        this.dragged = false;
        this.origin = {x: null, y: null};
        this.d_xy = {x: null, y: null};
        this.attempts = [];
        this.instructions = {
            initial: 'You will now perform the calibration task three times.',
            repeat_task: " of 3 calibrations completed. Press SPACE to continue.",
            restart_task: 'Please be more precise in matching the box size to the card you are holding. The calibration phase will begin again.'
        };
        this.presenting_instructions = false;
        this.tutorial_card = 0;
        this.tutorial_cards = [
            [`<p>This experiment will be made visually larger or smaller depending on your distance from, and the size of, your screen.</p>` +
            `<p>A tutorial will shortly begin to demonstrate how to calibrate this experiment for your current circumstances.</p>` +
            `<p>To advance to the next step press <span class='key'>></span>, and to go back a step press` +
            `<span class='key'><</span>.</p>`],
            [`<p>It's vital that you maintain the same distance from the screen throughout the experiment. </p>` +
            `<p> So please sit comfortably in a position you could maintain for the next 60 minutes.</p>`,
                './img/dva_mgr/card_1.jpg'],
            ["Roll up a sheet of paper into a tube the long way.",
                './img/dva_mgr/card_2.jpg'],
            ["Hold up a standard credit or debit card between you and your monitor, with the card the distance of that tube from your eyes.",
                './img/dva_mgr/card_3.jpg'],
            ["In a moment a rectangle will appear on screen. The box will have a 'handle', a red square in the bottom-right; this handle can be used to resize the rectangle.",
                './img/dva_mgr/card_4.jpg'],
            ["Resize the rectangle to be precisely the width of the credit card as you perceive it. Only the red borders of the box should be visible.",
                './img/dva_mgr/card_5.jpg'],
            ["When you have finished resizing the rectangle, press the space bar to advance. You will do this three times."]
        ];

        this.styles = {
            "body": { "background-color": "rgb(45,45,48)"},
            "#reference-box": {
                "background-color": "white",
                "width": "50%",
                "height": "1%",
                "position": "relative",
                "display": "block",
                "margin": "7.5% auto",
                "border": "5px solid red",
                "box-sizing": "border-box"
            },
            "#reference-box-resize-handle": {
                "width": "25px",
                "height": "25px",
                "background-color": "rgba(100,165,255, .75)",
                "border": "6px solid rgb(0,0,255)",
                "box-sizing": "border-box",
                "border-radius": "99999px",
                "position": "absolute",
                "right": "-15px",
                "bottom": "-15px",
                "cursor": "nwse-resize"
            },
            "p": {
                width: "100%",
                "font-size": `${parseInt(window.innerHeight * 0.05)}px`,
                "margin-top": `${parseInt(0.5 * (window.innerHeight - (window.innerHeight * 0.05)))}px`,
                "text-align": "center",
                "color": "white",
                "font-family": "sans-serif"
            },
            "#tutorial-card": {
                width: `${parseInt(0.90*window.innerWidth)}px`,
                height: `${parseInt(0.75*window.innerHeight)}px`,
                'position':'relative',
                'box-sizing': 'border-box',
                'flex-direction': 'column',
                'overflow-y': 'auto',
                'background-color': 'rgba(25,25,28, 0.75)',
                'border': '1px solid white',
                'box-shadow': '5px 5px 5px rgba(0,0,0,.25)',
                'padding': '2.5%',
                'margin': `${parseInt(0.5 * (window.innerHeight - (0.75 * window.innerHeight)))}px auto 0 auto`,
                'overflow': 'hidden',

            },
            'p.tutorial-instructions': {
                width: '40%',
                height: 'auto',
                "font-size": `${window.innerHeight * 0.0275}px`,
                "margin-top": `.25em`,
                "text-align": "left",
                "color": "white",
                "font-family": "sans-serif",
                "display": "inline-block",


            },
            'p.tutorial-instructions p': {
                "font-size": `inherit`,
                "margin-top": `inherit`,
                "text-align": "inherit",


            },
            'div.image': {
                "display": "inline-block",
                "width": "50%",
                "height": "60%",
                "border": "1px solid white",
                "vertical-align": "top",
                "margin-top": `.5em`,
                "margin-left": "2em",
                "background-size": "100%",
                "background-repeat": 'no-repeat'
            },
            'span.key': {
                'display': 'inline-block',
                'width': '1.5em',
                'color': 'white',
                'background-color': 'purple',
                'border': '1px solid black',
                'border-radius': '0.25em',
                'text-align': 'center',
                'margin': '0 .25em'
            },
            '#tutorial-card .progress': {
                'position':'absolute',
                'bottom': '5%',
                'right': '5%',
                'color': 'white',
                'font-family': 'sans-serif'

            }
        };


        return;
    };

    init(skip_calibration, skip_tutorial) {
        // basically dev mode
        if (skip_calibration) {
            this.scale = 1.0;
            return this.launch();
        }


        // aspect ratio of standard canadian card (license, debit, etc.,)
        // This must be changed if another reference object is used.
        this.aspect_ratio = 85.6 / 54;

        // Compute radial width of ref obj (credit card), then convert to degrees
        // Could be hard-coded, but this allows for custom ref objects if so desired (note: aspect_ratio must correspondingly be changed)
        this.reference.object.width.radians = 2 * Math.atan((this.reference.object.width.mm / 2) / this.view_distance);
        this.reference.object.width.degrees = this.reference.object.width.radians * (180 / Math.PI);

        // Create html for display
        this.DOM.reference.box = $("<div />").attr('id', 'reference-box');
        this.DOM.reference.resize_handle = $("<div />").attr('id', 'reference-box-resize-handle');
        this.DOM.instructions = $("<div />").html(this.instructions);
        this.DOM.tutorial.card = $("<div />").attr('id', 'tutorial-card');
        this.DOM.tutorial.instructions = $("<p />").addClass('tutorial-instructions');
        this.DOM.tutorial.image = $("<div />").addClass('image');
        this.DOM.tutorial.progress = $("<div />").addClass('progress');
        $(this.DOM.tutorial.card).append([this.DOM.tutorial.instructions, this.DOM.tutorial.image, this.DOM.tutorial.progress]);

        // generate CSS & append to head
        let additional_styles = "";
        for (let selector in this.styles) {
            additional_styles += `\t${selector} {\n`;
            for (let property in this.styles[selector]) {
                additional_styles += `\t\t${property}: ${this.styles[selector][property]};\n`;
            }
            additional_styles += `\t}\n\n`;
        }
        $("head").append($("<style />").attr("id", "additional-styles").html(additional_styles));

        // attach the handle to the reference box
        $(this.DOM.reference.box).append(this.DOM.reference.resize_handle);

        if (this.tutorial_card === 0) {
            // now we attach handlers for clicking and key-presses; we start with key-presses
            $("body").on('keydown', null, {self:this}, function (e) {
                let self = e.data.self;
                let key = e.which;
                // handles evaluation-completion key-press
                if (key === 188 || key === 37) {
                    if (self.tutorial_card > 0) self.tutorial_card--;
                    return self.change_card();
                }
                if (key === 190 || key === 39) {
                    if (self.tutorial_card === self.tutorial_cards.length - 1) {
                        $("#tutorial-card").remove();
                        return self.start_calibration()
                    } else {
                        self.tutorial_card++;
                        return self.change_card();
                    }
                }
            });
        }

        // Start tutorial sequence, or proceed straight to calibration.
        if (!skip_tutorial) {
            $("body").append(this.DOM.tutorial.card);
            this.change_card();
        } else {
            this.start_calibration()
        }
    }

    start_calibration() {
        this.build_task();
        this.reference.element.width.initial = $(this.DOM.reference.box).width();
        this.reference.element.height.initial = $(this.DOM.reference.box).height();
        this.reference.element.initial_margin = $(this.DOM.reference.box).css('margin-top');
        $("body").on('keydown', null, {self: this}, this.apply);
        $("body").on('mousedown', "#reference-box-resize-handle", {self: this}, this.toggle_drag);
        $("body").on('mouseup', null, {self: this}, this.toggle_drag);
        $("body").on('mousemove', null, {self: this}, this.resize);
    };


    /**
     * Builds (and rebuild) the task elements and attaches them to the DOM after each attempt at resizing
     * @param resetting
     */
    build_task(resetting) {
        if (resetting) {
            $(this.DOM.reference.box).css({
                height: this.reference.element.height.initial,
                width: this.reference.element.width.initial,
                'margin-top': this.reference.element.initial_margin
            });
        }
        $("body").append($("<div />").attr('id', 'task-wrapper').append(this.DOM.reference.box));

        // Proportionately set height of reference (resized) box
        $(this.DOM.reference.box).css('height', `${$(this.DOM.reference.box).width() / this.aspect_ratio}px`);

        $(this.DOM.reference.box).css('margin-top', `${0.5 * (window.innerHeight - $(this.DOM.reference.box).height())}px`);
    }


    /**
     * Handles spacebar presses, basically, whether to advance the screen or confirm the task; calls launch (set by user
     * at run time) after three consecutive valid attempts are registered.
     *
     * On each pass, current pixel width of reference box is divided by computed degree width of reference obj
     * resulting in a DVA value. Once three calibrations have been performed, the average DVA value is divided
     * by the initial 'seed' DVA value provided.
     *
     * This ratio of 'computed' to 'seed' DVA is applied as a scale transform (either shrinking or enlarging
     * elements)
     *
     * Note: this transformation must be performed on the outer most wrapper; so this will need to be changed
     * according to the developers' use case.
     *
     * @param e
     */
    apply(e) {
        let self = e.data.self;
        if (String.fromCharCode(e.which) === " " && self.dragged) {
            if (self.attempts.length < 3) {
                if (!self.presenting_instructions) {
                    self.attempts.push($(self.DOM.reference.box).width() / self.reference.object.width.degrees);
                    // make sure no attempt is wildly inaccurate
                    if (self.attempts.length > 1) {
                        for (let i = 0; i < self.attempts.length - 1; i++) {
                            console.log(Math.abs(1 - self.attempts[i] / self.attempts[-1]));
                            if (Math.abs(1 - self.attempts[i] / self.attempts[-1]) > 0.01) return self.restart();
                        }
                    }
                }
                self.reset();
            } else {
                $("body").off();
                self.scale = (self.attempts.reduce(sum) / 3.0) / self.one_dva;
                // inverse of self.scale, applied to textual elements to 'reset' to original size before scaling
                self.inverse_scale = 1.0 / self.scale;
                $("head").append(
                    $('<style />').html(
                        // NOTE: This class selector MUST be changed to correspond to that of the outer most wrapper for your use case
                        `\t.jspsych-display-element { \n` +
                        `\t\ttransform: scale(${self.scale})\n` +
                        `\t}`
                        // scaling text
                        `\tp, a, span { \n` +
                        `\t\ttransform: scale(${self.inverse_scale})\n` +
                        `\t}`
                    )
                );
                // pull out the CSS added during init()
                $('#additional-styles').remove();
                self.launch();
            }
        }
    }

    /**
     * Called after each valid attempt, returns reference box to initial size; is iteratively called to pass between
     * instructions screens and task screens
     */
    reset() {
        // clear the body
        $("body").html('');

        // instructions and task alternate; whatever phase we were in, now we switch to the other
        if (!this.presenting_instructions) {
            $("body").append($("<p />").html(this.attempts.length + this.instructions.repeat_task));
            this.presenting_instructions = true;
        } else {
            this.dragged = false;
            this.presenting_instructions = false;
            this.build_task(true)
        }
    }

    /**
     * Only called if an attempt varies too greatly from previous attempts; completely restarts entire task.
     */
    restart() {
        this.attempts = [];
        this.dragged;
        $('body').html('');
        $('body').append($("<p />").html(this.instructions.restart_task));

        // the seriously-tho-don't-fuck-up message can't be avoided, it's just gonna be mad at you for 3 seconds.
        setTimeout(this.build_task(true), 3000);
    }

    /**
     * Listener to detect whether or not mouse activity should currently be considered "dragging"; bound to mouseup and
     * mousedown on the reference box's handle
     * @param e
     */
    toggle_drag(e) {
        let self = e.data.self;
        e.stopPropagation();
        e.preventDefault();
        self.dragging = e.type === "mousedown";
        if (self.dragging) {
            self.dragged = true; // just ensuring the user did this at least once
            self.origin.x = e.pageX;
            self.origin.y = e.pageY;
            self.reference.element.width.computed = Math.floor($(self.DOM.reference.box).outerWidth);
            self.reference.element.height.computed = Math.floor($(self.DOM.reference.box).outerHeight);
        }
    }

    /**
     * Handler for updating the reference box as it's handle is dragged
     * @param e
     */
    resize(e) {
        let self = e.data.self;
        if (self.dragging) {
            let window_x = window.innerWidth;
            let mouse_x = e.pageX;
            let reference_width = window_x - (2 * (window_x - mouse_x));
            let reference_height = Math.floor(reference_width / self.aspect_ratio);
            let margin = `${0.5 * (window.innerHeight - reference_height)}px`;
            $(self.DOM.reference.box).css({
                width: `${reference_width}px`,
                height: `${reference_height}px`,
                'margin-top': margin
            });

        }
    }

    /**
     * Just flips the content of the tutorial cards
     */
    change_card() {
        $(this.DOM.tutorial.progress).html(`${this.tutorial_card + 1} / ${this.tutorial_cards.length}`);
        $(this.DOM.tutorial.instructions).html(this.tutorial_cards[this.tutorial_card][0]);
        $(this.DOM.tutorial.image).css('background-image', `url(${this.tutorial_cards[this.tutorial_card][1]})`);
    }
}
