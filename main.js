/*
 * Copyright (c) 2015 Equals182.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50  */
/*global define, brackets, Mustache, $*/

define(function (require, exports, module) {
    "use strict";
    
    var AppInit = brackets.getModule("utils/AppInit"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        
        strings = require("strings"),
        toolbar = Mustache.render(require("text!htmlContent/toolbar.html"), strings),
        panel = Mustache.render(require("text!htmlContent/panel.html"), strings),
        
        eqftp = {
            ui: {
                toolbar: {
                    toggle: function () {
                        var panel_element = $("#eqftp__panel");
                        if (panel_element.length !== 1) {
                            $(".main-view .content").after(panel);
                            panel_element = $("#eqftp__panel");
                        }
                        if (panel_element.is(":visible")) {
                            panel_element.hide();
                            $(".main-view .content").css("right", eqftp.variables.defaults.main_view__content__right);
                        } else {
                            var main_toolbar__right = parseInt($("#main-toolbar").css("right").replace("px", ""), 10),
                                main_toolbar__width = $("#main-toolbar").outerWidth(),
                                panel__width = eqftp.variables.defaults.panel__width,
                                main_view__content__offset = panel__width;
                            if (main_toolbar__right === 0) {
                                panel_element.css("right", main_toolbar__width);
                                eqftp.variables.defaults.main_view__content__right = main_toolbar__width;
                                main_view__content__offset += main_toolbar__width;
                            } else {
                                panel_element.css("right", 0);
                            }
                            $(".main-view .content").css("right", main_view__content__offset);
                            panel_element.width(panel__width).show();
                        }
                    }
                },
                panel: {
                    toolbar: {
                        dropdown: function (params, e) {
                            $(params.id).toggle();
                        }
                    },
                    settings_window: {
                        toggle: function () {
                            $('#eqftp__panel__settings_window').toggleClass('active');
                        }
                    }
                },
                tab: {
                    toggle: function (params, e) {
                        if ($(params.target).hasClass('active')) {
                            $(params.target).slideUp(200).removeClass('active');
                            $(e.target).closest('.eqftp__tab_controller').removeClass('active');
                        } else {
                            $(params.target)
                                .closest('.eqftp__tabs_holder')
                                .find('.eqftp__tab.active')
                                .slideUp(200)
                                .removeClass('active');
                            $(params.target)
                                .closest('.eqftp__tabs_holder')
                                .find('.eqftp__tab_controller.active')
                                .removeClass('active');
                            $(params.target).slideDown(200).addClass('active');
                            $(e.target).closest('.eqftp__tab_controller').addClass('active');
                        }
                    }
                }
            },
            utils: {
                check: {
                    isFunction: function (input) {
                        var getType = {};
                        return input && getType.toString.call(input) === '[object Function]';
                    },
                    isJSON: function (input) {
                        try { JSON.parse(input); } catch (e) { return false; }
                        return true;
                    },
                    isObject: function (input) {
                        if (input !== null && typeof input === 'object') { return true; }
                        return false;
                    }
                },
                resize: {
                    srv: {
                        theobject: null,
                        thedependent: null,
                        direction: function (el) {
                            var xPos, yPos, offset, dir;
                            if (undefined !== (dir = $(el).attr('eqftp-resize'))) {
                                return dir;
                            }
                            dir = "";

                            xPos = window.event.offsetX;
                            yPos = window.event.offsetY;

                            offset = 8; //The distance from the edge in pixels

                            if (yPos < offset) {
                                dir += "n";
                            } else if (yPos > el.offsetHeight - offset) {
                                dir += "s";
                            }
                            if (xPos < offset) {
                                dir += "w";
                            } else if (xPos > el.offsetWidth - offset) {
                                dir += "e";
                            }

                            return dir;
                        },
                        down: function (el, sticker) {
                            var dir = eqftp.utils.resize.srv.direction(el);
                            if (dir === "") {
                                return;
                            }

                            eqftp.utils.resize.srv.theobject = {
                                el: null,
                                dir: "",
                                grabx: null,
                                graby: null,
                                width: null,
                                height: null,
                                left: null,
                                top: null
                            };

                            var theobject = eqftp.utils.resize.srv.theobject;
                            theobject.el = el;
                            theobject.dir = dir;

                            theobject.grabx = window.event.clientX;
                            theobject.graby = window.event.clientY;
                            theobject.width = el.offsetWidth;
                            theobject.height = el.offsetHeight;
                            theobject.left = el.offsetLeft;
                            theobject.top = el.offsetTop;

                            window.event.returnValue = false;
                            window.event.cancelBubble = true;
                        },
                        up: function () {
                            if (eqftp.utils.resize.srv.theobject) {
                                eqftp.utils.resize.srv.theobject.el.style.cursor = "default";
                            }
                            eqftp.utils.resize.srv.theobject = null;
                        },
                        move: function () {
                            var el, xPos, yPos, str, xMin, yMin,
                                theobject = eqftp.utils.resize.srv.theobject;
                            xMin = 8; //The smallest width possible
                            yMin = 8; //             height

                            //Dragging starts here
                            if (theobject !== null) {
                                var dir = theobject.dir;
                                el = theobject.el;
                                str = eqftp.utils.resize.srv.direction(el);
                                if (str === "") {
                                    str = "default";
                                } else {
                                    str += "-resize";
                                }
                                el.style.cursor = str;
                                
                                if (dir.indexOf("e") !== -1) { theobject.el.style.width = Math.max(xMin, theobject.width + window.event.clientX - theobject.grabx) + "px"; }
                                if (dir.indexOf("s") !== -1) { theobject.el.style.height = Math.max(yMin, theobject.height + window.event.clientY - theobject.graby) + "px"; }
                                if (dir.indexOf("w") !== -1) {
                                    //theobject.el.style.left = Math.min(theobject.left + window.event.clientX - theobject.grabx, theobject.left + theobject.width - xMin) + "px";
                                    theobject.el.style.width = Math.max(xMin, theobject.width - window.event.clientX + theobject.grabx) + "px";
                                }
                                if (dir.indexOf("n") !== -1) {
                                    //theobject.el.style.top = Math.min(theobject.top + window.event.clientY - theobject.graby, theobject.top + theobject.height - yMin) + "px";
                                    theobject.el.style.height = Math.max(yMin, theobject.height - window.event.clientY + theobject.graby) + "px";
                                }

                                eqftp.variables.defaults.panel__width = $(theobject.el).outerWidth();
                                window.event.returnValue = false;
                                window.event.cancelBubble = true;
                            }
                        }
                    }
                }
            },
            variables: {
                defaults: {
                    main_view__content__right: 30,
                    panel__width: 300
                }
            }
        };
    
    AppInit.htmlReady(function () {
        ExtensionUtils.loadStyleSheet(module, "styles/ext.css");
        $("#main-toolbar .buttons").append(toolbar);
        
        $('body').on('click', '[eqftp-click]', function (e) {
            e.preventDefault();
            var click = $(this).attr('eqftp-click'),
                actions = click.split('--'),
                methods = actions[0].split('__'),
                tmp = eqftp,
                args = {};
            if (!!actions[1]) {
                var arguments_pairs = actions[1].split(';');
                arguments_pairs.forEach(function (pair, n) {
                    pair = pair.split('=');
                    args[pair[0]] = pair[1];
                });
            }
            methods.some(function (o, n) {
                if (eqftp.utils.check.isObject(tmp[o])) {
                    tmp = tmp[o];
                } else if (eqftp.utils.check.isFunction(tmp[o])) {
                    tmp[o](args, e);
                    return true;
                } else {
                    return true;
                }
            });
        });
        $('body').on('click', function (e) {
            var t = e.target;
            if (!$(t).is('.eqftp__dropdown_holder') && $(t).closest('.eqftp__dropdown_holder').length === 0) {
                $('.eqftp__dropdown').hide();
            }
        });
        $('body').on('mousedown', '[eqftp-mousedown]', function () {
            if ($(this).attr('eqftp-mousedown') === 'resize') {
                var target = $(this),
                    sticker = null;
                if ($(this).attr('eqftp-resize-target')) {
                    target = $($(this).attr('eqftp-resize-target'));
                }
                if ($(this).attr('eqftp-resize-sticker')) {
                    sticker = $($(this).attr('eqftp-resize-sticker'));
                }
                eqftp.utils.resize.srv.down($(target).get(0), sticker);
            }
        });
        document.onmouseup   = eqftp.utils.resize.srv.up;
        document.onmousemove = eqftp.utils.resize.srv.move;
    });
    
    AppInit.appReady(function () {
        $("#main-toolbar .buttons .eqftp__toolbar__icon.disabled").removeClass('disabled');
    });
});