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
                                panel__width = 300,
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
                }
            },
            variables: {
                defaults: {
                    main_view__content__right: 30
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
            if (!$(t).is('.eqftp__dropdown-holder') && $(t).closest('.eqftp__dropdown-holder').length === 0) {
                $('.eqftp__dropdown').hide();
            }
        });
    });
    
    AppInit.appReady(function () {
        $("#main-toolbar .buttons .eqftp__toolbar__icon.disabled").removeClass('disabled');
    });
});