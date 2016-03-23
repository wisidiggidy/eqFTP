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
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        
        strings = require("strings"),
        crypto_core = require("core-min"),
        crypto_cypher = require("cipher-core-min"),
        crypto_aes = require("aes-min"),
        
        tpl__toolbar = Mustache.render(require("text!htmlContent/toolbar.html"), strings),
        tpl__panel = Mustache.render(require("text!htmlContent/panel.html"), strings),
        tpl__panel__searchDropdown__outer = Mustache.render(require("text!htmlContent/panel__searchDropdown--outer.html"), strings),
        tpl__panel__searchDropdown__row = Mustache.render(require("text!htmlContent/panel__searchDropdown--row.html"), strings),
        
        _version = "0.8.0",
        eqftp = {
            ui: {
                toolbar: {
                    toggle: function () {
                        eqftp.variables.ui.eqftp_panel = $(".eqftp-panel");
                        if (eqftp.variables.ui.eqftp_panel.length !== 1) {
                            eqftp.variables.ui.content.after(tpl__panel);
                            eqftp.variables.ui.eqftp_panel = $(".eqftp-panel");
                            
                            if (eqftp.variables.eqFTP.misc.first_start) {
                                var tpl__welcome_screen = Mustache.render(require("text!htmlContent/welcome_screen.html"), strings);
                                eqftp.variables.ui.eqftp_panel = $(".eqftp-panel");
                                eqftp.variables.ui.eqftp_panel.prepend(tpl__welcome_screen);
                            }
                        }
                        if (eqftp.variables.ui.eqftp_panel.is(":visible")) {
                            eqftp.variables.ui.eqftp_panel.hide();
                            eqftp.variables.ui.content.css("right", eqftp.variables.defaults.main_view__content__right);
                        } else {
                            var panel__right_offset = $(window).innerWidth() - (eqftp.variables.ui.content.offset().left + eqftp.variables.ui.content.width());
                            eqftp.variables.ui.eqftp_panel.css("right", panel__right_offset);
                            eqftp.variables.ui.content.css("right", (eqftp.variables.defaults.panel__width + panel__right_offset));
                            eqftp.variables.ui.eqftp_panel.width(eqftp.variables.defaults.panel__width).show();
                        }
                    }
                },
                panel: {
                    toolbar: {
                        search: {
                            dropdown: {
                                render: function (rerender) {
                                    if ($(eqftp.variables.ui.eqftp_panel__server_list).length === 0 || (rerender && rerender === 'rerender')) {
                                        var out = "";
                                        out += eqftp.utils.render(tpl__panel__searchDropdown__row, {title: 'T', host: 'H', user: 'U'});
                                        out += eqftp.utils.render(tpl__panel__searchDropdown__row, {title: 'T2', host: 'H2', user: 'U2'});
                                        out = eqftp.utils.render(tpl__panel__searchDropdown__outer, {content: out});
                                        if ($(eqftp.variables.ui.eqftp_panel__server_list).length === 1) {
                                            $(eqftp.variables.ui.eqftp_panel__server_list).remove();
                                        }
                                        $('.eqftp-panel__header__inputHolder').append(out);
                                    }
                                },
                                toggle: function () {
                                    eqftp.ui.panel.toolbar.search.dropdown.render();
                                    if (!$(eqftp.variables.ui.eqftp_panel__server_list).is(":visible")) {
                                        $('.eqftp-panel__header__input').focus();
                                    }
                                    $(eqftp.variables.ui.eqftp_panel__server_list).slideToggle(80);
                                },
                                show: function () {
                                    eqftp.ui.panel.toolbar.search.dropdown.render();
                                    $(eqftp.variables.ui.eqftp_panel__server_list).slideDown(80);
                                }
                            },
                            mode: {
                                filter: function () {
                                    var v = $('.eqftp-panel__header__input').val();
                                    if (v) {
                                        var r = new RegExp('.*?' + v + '.*?', 'i');
                                        $.each($('.eqftp-panel__server_dropdown_item'), function () {
                                            var fi = $(this).attr('data-fullinfo');
                                            if (!r.test(fi)) {
                                                $(this).hide();
                                            } else {
                                                $(this).show();
                                            }
                                        });
                                        $('.eqftp-panel__header__inputHolder__iconClear').fadeIn(200);
                                        $('.eqftp-panel__header__inputHolder__iconDropdown').fadeOut(200);
                                    } else {
                                        $('.eqftp-panel__server_dropdown_item').show();
                                        $('.eqftp-panel__header__inputHolder__iconClear').fadeOut(200);
                                        $('.eqftp-panel__header__inputHolder__iconDropdown').fadeIn(200);
                                    }
                                }
                            }
                        },
                        infofooter: {
                            toggle: function (params, e) {
                                if ($(e.target).closest('.eqftp-infofooter--msgholder').length > 0) {
                                    $('.eqftp-panel__infofooter').toggleClass('fullsized');
                                }
                            }
                        }
                    },
                    settings_window: {
                        toggle: function (params, e) {
                            if ($(e.target).closest('.eqftp-hamburger').length > 0) {
                                $(e.target).closest('.eqftp-hamburger').toggleClass('active');
                            }
                            $('.eqftp-panel__header__inputHolder').toggleClass('eqftp-invisible');
                            $('.eqftp-panel__header__settingsHeader').toggleClass('eqftp-invisible');
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
                // accepts string `path__to__method--parameter=value;second=foobar` excluding eqftp in start
                action: function (action, event) {
                    var actions = action.split('--'),
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
                            tmp[o](args, event);
                            return true;
                        } else {
                            return true;
                        }
                    });
                },
                // all sorts of checks
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
                    },
                    isString: function (input) {
                        var getType = {};
                        return input && getType.toString.call(input) === '[object String]';
                    },
                    isArray: function (input) {
                        return input.isArray;
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
                },
                // replaces placeholders with given paremeters
                render: function (tpl, params, prefix) {
                    if (eqftp.utils.check.isString(tpl) && eqftp.utils.check.isObject(params)) {
                        var key;
                        if (!prefix) {
                            prefix = '';
                        }
                        for (key in params) {
                            if (params.hasOwnProperty(key)) {
                                var o = params[key];
                                if (eqftp.utils.check.isObject(o)) {
                                    tpl = eqftp.utils.render(tpl, o, prefix + key + '.');
                                } else if (eqftp.utils.check.isString(o)) {
                                    var str = eqftp.utils.escape('[[' + prefix + key + ']]'),
                                        r = new RegExp(str, 'g');
                                    tpl = tpl.replace(r, o);
                                } else {
                                    return tpl;
                                }
                            }
                        }
                    }
                    return tpl;
                },
                escape: function (str) {
                    return str.replace(/[\-\/\\\^\$\*\+\?\.\(\)|\[\]{}]/g, '\\$&');
                },
                open_file_dialog: function (title, start_path, callback) {
                    if (!start_path || !eqftp.utils.check.isString(start_path)) {
                        start_path = false;
                    }
                    if (!title || !eqftp.utils.check.isString(title)) {
                        title = strings.eqftp__file_opening_dialog_title;
                    }
                    if (!callback || !eqftp.utils.check.isFunction(callback)) {
                        callback = function () {};
                    }
                    FileSystem.showOpenDialog(false, false, title, start_path, null, callback);
                },
                save_file_dialog: function (title, start_path, callback) {
                    if (!start_path || !eqftp.utils.check.isString(start_path)) {
                        start_path = false;
                    }
                    if (!title || !eqftp.utils.check.isString(title)) {
                        title = strings.eqftp__file_saving_dialog_title;
                    }
                    if (!callback || !eqftp.utils.check.isFunction(callback)) {
                        callback = function () {};
                    }
                    FileSystem.showSaveDialog(title, start_path, 'settings.eqftp', callback);
                }
            },
            _settings: {
                load: function (file_path) {
                    
                },
                save: function (file_path) {
                    
                },
                _init: function () {
                }
            },
            _init: function () {
                eqftp.variables.preferences.definePreference("eqFTP", "object", eqftp.variables.defaults.eqFTP);
                eqftp.variables.eqFTP = eqftp.variables.preferences.get("eqFTP");
                eqftp._settings._init();
            },
            variables: {
                eqFTP: false,
                version: _version,
                defaults: {
                    main_view__content__right: 30,
                    panel__width: 300,
                    eqFTP: {
                        main: {
                            projects_folder: "",
                            date_format: "%d %m %Y",
                            debug: false,
                            open_project_connection: false
                        },
                        misc: {
                            version: _version,
                            first_start: true
                        },
                        local_paths: [],
                        connections: []
                    }
                },
                ui: {
                    content: $('.main-view .content'),
                    eqftp_panel: $(".eqftp-panel"),
                    eqftp_panel__server_list: '.eqftp-panel__server_dropdown_holder'
                },
                preferences: PreferencesManager.getExtensionPrefs("eqFTP")
            }
        };
    
    AppInit.htmlReady(function () {
        ExtensionUtils.loadStyleSheet(module, "styles/ext.css");
        $("#main-toolbar .buttons").append(tpl__toolbar);
        
        $('body').on('click', '[eqftp-click]', function (e) {
            e.preventDefault();
            eqftp.utils.action($(this).attr('eqftp-click'), e);
        });
        $('body').on('keyup', '[eqftp-keyup]', function (e) {
            eqftp.utils.action($(this).attr('eqftp-keyup'), e);
        });
        $('body').on('click', function (e) {
            var t = e.target,
                protector = $(t).closest('.eqftp-hide_on_click_anywhere_else__protector');
            if (protector.length === 0) {
                $('.eqftp-hide_on_click_anywhere_else').hide();
            } else {
                var protect = $('body');
                if (protector.attr('eqftp-hocae_protect')) {
                    protect = $(protector.attr('eqftp-hocae_protect'));
                } else {
                    var p = protector.find('.eqftp-hide_on_click_anywhere_else');
                    if (p.length > 0) {
                        protect = p;
                    }
                }
                $('.eqftp-hide_on_click_anywhere_else').not(protect).hide();
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
        $("#main-toolbar .buttons .eqftp-toolbar__icon.disabled").removeClass('disabled');
        eqftp._init();
    });
});