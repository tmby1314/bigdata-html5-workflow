/**
 * Created by xushanshan on 16/3/9.
 */
(function ($, window) {

    //拖拽插件定义
    jQuery.fn.workflow = function (xmlContent) {

        //别名
        var _self = this;

        //键盘码
        var keyboardCode = {
            ALT: 18,
            BACKSPACE: 8,
            COMMA: 188,
            CTRL: 17,
            DELETE: 46,
            DOWN: 40,
            END: 35,
            ENTER: 13,
            ESCAPE: 27,
            HOME: 36,
            LEFT: 37,
            PAGE_DOWN: 34,
            PAGE_UP: 33,
            PERIOD: 190,
            RIGHT: 39,
            SPACE: 32,
            SHIFT: 16,
            TAB: 9,
            UP: 38
        };

        // 默认参数
        var config = {
            //canvas 宽度
            canvasWidth: 800,
            //canvas 高度
            canvasHeight: 500,
            //图标宽度
            nodeWidth: 40,
            //图标高度
            nodeHeight: 40,
            //连线线宽
            hopWidth: 1,
            //连线箭头高度
            arrowHeight: 18,
            //连线箭头宽度
            arrowWidth: 6,
            //圆形按钮半径
            radius: 5
        };

        //全局参数
        var globalParam = {
            xmlContent: null,
            canvas: null,
            canvasContext: null,
            mouseDragNode: null,
            onDrawLine: false,
            propertyTable: null
        };


        // 初始化函数
        var _init = function () {
            //只初始化一次
            if (globalParam.xmlContent == null) {
                _initData();
                // 事件绑定
                _loadEvent();
                // 加载内容
                _loadContent();

                canvasContentDraw();
            } else {
                alert("workflow has been initialized, never initialize again");
            }
        }

        // 初始化数据
        var _initData = function () {
            if (xmlContent || xmlContent.length == 0) {
                globalParam.xmlContent = $(xmlContent);
            } else {
                globalParam.xmlContent = $('<?xml version="1.0" encoding="utf-8"?><flow><files></files><nodes></nodes><hops></hops></flow>');
            }

            // 生成拖拽框
            var mainDiv = $('<div></div>');
            mainDiv.attr("style", "width: 1024px; height: 768px; background-color: rgb(216, 216, 216); border: 1px solid #C0C0C0; margin: 0 auto; position: relative; padding: 0;");
            var mainTitle = $('<p>作业设计</p>');
            mainTitle.attr("style", "background-color: rgb(223, 246, 249); width: 100%; height: 36px; color: black; position: absolute; top: 0px; line-height: 35px; text-indent: 1em; font-weight: bold; font-size: 14px; margin: 0; padding: 0;");
            var leftBox = $('<div></div>');
            leftBox.attr("style", "width: 19.5%; background: white; position: absolute; top: 5.5%; top: 40px; bottom: 0px; left: 0px; margin: 0; padding: 0;");
            var leftBoxTitle = $('<p>选择组件</p>');
            leftBoxTitle.attr("style", "background-color: rgb(237, 249, 251); width: 100%; height: 30px; color: black; position: absolute; top: 0px; line-height: 30px; text-indent: 1em; font-weight: bold; font-size: 14px; margin: 0; padding: 0;");
            var chooseBox = $('<div></div>');
            chooseBox.attr("style", "margin-top: 30px; border:1px solid #c3c3c3;");
            var rightBox = $('<div></div>');
            rightBox.attr("style", "width: 80%; position: absolute; top: 40px; left: 20%; bottom: 0px; margin: 0; padding: 0;");
            var workflowDiv = $('<div tabindex="0"></div>');
            workflowDiv.attr("style", "width: 100%; height: 67.2%; background-color: white; margin: 0; padding: 0;");
            var workflowTitle = $('<p>作业设计</p>');
            workflowTitle.attr("style", "background-color: rgb(237, 249, 251); width: 100%; height: 30px; color: black; position: absolute; top: 0px; line-height: 30px; text-indent: 1em; font-weight: bold; font-size: 14px; margin: 0; padding: 0;");

            var canvas = $('<canvas>您的浏览器不支持canvas，请升级浏览器</canvas>').attr("style", "margin-top: 31px;");

            var propertyDiv = $('<div></div>');
            propertyDiv.attr("style", "width: 100%; bottom: 0px; background: white; position: absolute; top: 68%; margin: 0; padding: 0;");
            var propertyTitle = $('<p>属性</p>');
            propertyTitle.attr("style", "background-color: rgb(237, 249, 251); width: 100%; height: 30px; color: black; position: absolute; top: 0px; line-height: 30px; text-indent: 1em; font-weight: bold; font-size: 14px; margin: 0; padding: 0;");

            var tableDiv = $('<div></div>');
            tableDiv.attr("style", "width: 100%; background: white; overflow: auto; position: absolute; top: 30px; bottom: 0px; margin: 0; padding: 0;");
            var table = $('<table border="1" cellspacing="0" bordercolor="#000000"></table>');
            table.attr("style", "border-collapse:collapse; width: 100%; font-size: 14px; position: absolute; top: 0px;");

            var titleTr = $('<thead><tr><td style="text-align: center; width: 150px;">属性名</td><td style="text-align: center;">属性值</td><td style="text-align: center; width: 150px;">属性说明</td></tr></thead><tbody style="font-size: 12px;"></tbody>');

            table.append(titleTr);
            //属性框
            tableDiv.append(table);
            propertyDiv.append(propertyTitle);
            propertyDiv.append(tableDiv);

            //拖拽框
            workflowDiv.append(workflowTitle);
            workflowDiv.append(canvas);

            //右边框
            rightBox.append(workflowDiv);
            rightBox.append(propertyDiv);

            //左边框
            leftBox.append(leftBoxTitle);
            leftBox.append(chooseBox);

            //大框
            mainDiv.append(mainTitle);
            mainDiv.append(leftBox);
            mainDiv.append(rightBox);

            $(_self).append(mainDiv);


            canvas.attr("width", workflowDiv.width() - 2);
            canvas.attr("height", workflowDiv.height() - 30);
            config.canvasWidth = workflowDiv.width() - 2;
            config.canvasHeight = workflowDiv.height() - 30;

            chooseBox.width(leftBox.width() - 1);
            chooseBox.height(leftBox.height() - 30);

            //加载插件
            for (var index = 0; index < plugins.length; index++) {
                var plugin = plugins[index];
                var image = plugin['image'];
                var type = plugin['type'];
                var pluginNode = $('<img src="' + image + '" draggable="true" width="' + config.nodeWidth + '" height="' + config.nodeHeight + '"  style="border:1px solid #c3c3c3;" id="' + type + '">');
                pluginNode[0].ondragstart = function () {
                    dragStart(event);
                };
                chooseBox.append(pluginNode);
            }

            canvas[0].ondragover = function () {
                canvasDragOver(event);
            };

            canvas[0].ondrop = function () {
                canvasDrop(event);
            }

            $(workflowDiv).keydown(function () {
                console.log("event.keyCode = " + event.keyCode)
                if (event && event.keyCode == keyboardCode.SHIFT) { // 按 SHIFT
                    globalParam.onDrawLine = true;
                }
            });
            $(workflowDiv).keyup(function () {
                if (event && event.keyCode == keyboardCode.SHIFT) { // 松开 SHIFT
                    globalParam.onDrawLine = false;
                }
                if (event.keyCode == keyboardCode.DELETE || (event.ctrlKey && event.keyCode == keyboardCode.BACKSPACE)) {
                    var selectedNode = getSelectedNode();
                    var name = $(selectedNode).children("name").text();
                    //删除一个节点以及这个节点上的连线
                    deleteNode(name);
                    deleteNodeHops(name);
                    canvasContentDraw();
                }

            });

            globalParam.propertyTable = table;
            globalParam.canvas = canvas;
            globalParam.canvasContext = globalParam.canvas[0].getContext("2d");

        };

        // 绑定事件
        var _loadEvent = function () {
            $(globalParam.canvas).mousedown(canvasOnMouseDown);
            $(globalParam.canvas).mouseup(canvasOnMouseUp);
            $(globalParam.canvas).mousemove(canvasMouseMove);
            $(globalParam.canvas).contextmenu(function (e) {
                e.preventDefault();
            });
        };

        var _loadContent = function () {

        };

        var canvasOnMouseDown = function (ev) {
            if (ev.button == 0) {
                //点击了左键
                if (globalParam.onDrawLine == true) {
                    var mousePosition = getMousePosition(ev);
                    var evx = mousePosition.x;
                    var evy = mousePosition.y;

                    var startNode = getSelectedNode();
                    var endNode = getClickNode(evx, evy);
                    //判断是否是有效的连线
                    if (startNode != null && endNode != null && startNode != endNode) {
                        var startNodeName = $(startNode).children("name").text();
                        var endNodeName = $(endNode).children("name").text();
                        var hasLine = hasHop(startNode, endNode);
                        if (hasLine == false) {
                            var hop = $('<hop></hop>');
                            $(hop).append($('<type>connect</type>'));
                            $(hop).append($('<from>' + startNodeName + '</from>'));
                            $(hop).append($('<to>' + endNodeName + '</to>'));
                            $(hop).append($('<enabled>Y</enabled>'));
                            $(hop).append($('<evaluation>Y</evaluation>'));
                            $(hop).append($('<unconditional>Y</unconditional>'));
                            $(globalParam.xmlContent).find("hops").append(hop);

                        } else {
                            alert("连线已存在");
                        }
                    }
                    globalParam.onDrawLine = false;
                    clearAllSelectedNode();
                    $(endNode).attr("selected", "true");
                    canvasContentDraw();

                } else {
                    //不是连线动作

                    var mousePosition = getMousePosition(ev);
                    var evx = mousePosition.x;
                    var evy = mousePosition.y;

                    var selectedNode = getClickNode(evx, evy);
                    if (selectedNode != null) {
                        //点击的是节点
                        var selected = $(selectedNode).attr("selected");
                        var name = $(selectedNode).children("name").text();
                        if (selected == "true") {
                            //判断鼠标是否在删除按钮上
                            var isDelete = checkClickNodeDelete(name, evx, evy);
                            if (isDelete == true) {
                                //删除一个节点以及这个节点上的连线
                                deleteNode(name);
                                deleteNodeHops(name);
                                canvasContentDraw();
                            } else {
                                //重新点击了一个选中的节点
                                //清除所有选中的节点
                                clearAllSelectedNode();
                                //设置这个节点为新的被选中的节点
                                $(selectedNode).attr("selected", "true");
                                canvasContentDraw();
                                //可能是拖拽
                                globalParam.mouseDragNode = selectedNode;
                            }
                        } else {
                            //点击的是一个未选中的节点
                            //清除所有选中的节点
                            clearAllSelectedNode();
                            //设置这个节点为新的被选中的节点
                            $(selectedNode).attr("selected", "true");
                            canvasContentDraw();
                            //可能是拖拽
                            globalParam.mouseDragNode = selectedNode;
                        }

                    } else {
                        //点击的是线
                        var isDeleteHop = checkClickHopDelete(evx, evy);
                        if (isDeleteHop == false) {
                            var isChangeHop = checkClickHopChange(evx, evy);
                            if (isChangeHop == false) {
                                //点击的是空白区域
                                //清除所有选中的节点
                                //取消拖拽
                                globalParam.mouseDragNode = null;
                                var result = clearAllSelectedNode();
                                if (result != 0) {
                                    canvasContentDraw();
                                }

                            } else {
                                //改变了一条线的状态
                                canvasContentDraw();
                            }
                        } else {
                            //删除了一条线
                            canvasContentDraw();
                        }

                    }
                }

            } else if (ev.button == 1) {
                // 点击了滑轮
            } else if (ev.button == 2) {
                //点击了右键
            }

        };

        var canvasOnMouseUp = function (ev) {
            //如果选中的是节点 属性框显示这个节点的属性
            if (ev.button == 0) {
                //点击了左键
                globalParam.mouseDragNode = null;

                //加载节点属性
                var selectedNode = getSelectedNode();
                if (selectedNode == null) {
                    //加载全局参数
                    console.log("加载全局参数");
                    var dependence = $(globalParam.xmlContent).find("files");
                    $(globalParam.propertyTable).find("tbody").html("");
                    dependence.each(function (index, ele) {
                        var file = $(ele).text();
                        $(globalParam.propertyTable).find("tbody").append('<tr><td style="text-align: center; width: 150px;">依赖文件</td><td><textarea cols="82" rows="7" style="resize: none;" readonly="readonly">' + file + '</textarea></td><td></td></tr>');
                        //绑定关联文件输入框的点击事件
                        var textArea = $(globalParam.propertyTable).find("tbody").find("textarea");
                        $(textArea).click(function () {
                            var value = _self.setTextAreaValue();
                            $(textArea).val(value);
                        });

                        $(textArea).blur(function () {
                            console.log("应该依赖文件列表要保存到XML里面去");
                        });
                    });

                } else {
                    $(globalParam.propertyTable).find("tbody").html("");
                    var properties = $(selectedNode).find("properties").children();
                    for (var index = 0; index < properties.length; index++) {
                        var ele = properties[index];
                        var tagName = ele.tagName;
                        var type = $(ele).attr("type");
                        var name = $(ele).attr("title");
                        var value = $(ele).text().trim();
                        var description = $(ele).attr("description");
                        if ("file" == type) {
                            var oneProperty = $('<tr><td style="text-align: center; width: 150px;">' + name + '</td><td><input readonly style="width: 98%" value="' + value + '" id="' + tagName + '"></td><td style="text-align: center">' + description + '</td></tr>');
                            var inputBox = $(oneProperty).find("#" + tagName);

                            $(inputBox).click(function () {
                                var value = _self.setInputValue();
                                var tagName = $(this).attr("id");
                                $(selectedNode).find(tagName).text(value);
                                $(this).val(value);
                            });

                            $(globalParam.propertyTable).find("tbody").append(oneProperty);
                        } else if ("files" == type) {

                        } else if ("text" == type) {
                            var oneProperty = $('<tr><td style="text-align: center; width: 150px;">' + name + '</td><td><input style="width: 98%" value="' + value + '" id="' + tagName + '"></td><td style="text-align: center">' + description + '</td></tr>');
                            var inputBox = $(oneProperty).find("#" + tagName);

                            $(inputBox).keyup(function () {
                                var tagName = $(this).attr("id");
                                $(selectedNode).find(tagName).text($(this).val());
                                canvasContentDraw();
                            });

                            $(globalParam.propertyTable).find("tbody").append(oneProperty);
                        }

                    }


                }
            } else if (ev.button == 1) {
                // 点击了滑轮
            } else if (ev.button == 2) {
                //点击了右键
            }

        };

        var canvasMouseMove = function (ev) {
            if (globalParam.mouseDragNode != null) {
                var mousePosition = getMousePosition(ev);
                var evx = mousePosition.x;
                var evy = mousePosition.y;

                //不允许图标超出画图框
                evx = (evx > (config.nodeWidth / 2)) ? evx : config.nodeWidth / 2;
                evy = (evy > (config.nodeHeight / 2)) ? evy : config.nodeHeight / 2;
                evx = (evx < (config.canvasWidth - config.nodeWidth / 2)) ? evx : (config.canvasWidth - config.nodeWidth / 2);
                evy = (evy < (config.canvasHeight - config.nodeHeight / 2)) ? evy : (config.canvasHeight - config.nodeHeight / 2);

                $(globalParam.mouseDragNode).attr("x", evx - config.nodeWidth / 2);
                $(globalParam.mouseDragNode).attr("y", evy - config.nodeHeight / 2);

                canvasContentDraw();
            } else if (globalParam.onDrawLine == true) {
                canvasContentDraw();
                var selectedNode = getSelectedNode();
                if (selectedNode != null) {
                    var x = $(selectedNode).attr("x");
                    var y = $(selectedNode).attr("y");
                    var startX = parseInt(x) + (config.nodeWidth / 2);
                    var startY = parseInt(y) + (config.nodeHeight / 2);
                    var p = getMousePosition(ev);
                    var endX = p.x;
                    var endY = p.y;

                    //=====画连线=====
                    globalParam.canvasContext.beginPath();
                    globalParam.canvasContext.lineWidth = config.hopWidth;
                    globalParam.canvasContext.strokeStyle = "black";
                    globalParam.canvasContext.moveTo(startX, startY);
                    globalParam.canvasContext.lineTo(endX, endY);
                    globalParam.canvasContext.closePath();
                    globalParam.canvasContext.stroke();
                    globalParam.canvasContext.beginPath();
                    //画箭头
                    var middleX = (startX + endX) / 2;
                    var middleY = (startY + endY) / 2;
                    var arrowHeight = config.arrowHeight;
                    var arrowWidth = config.arrowWidth;
                    var angle = Math.atan2(endY - startY, endX - startX);

                    globalParam.canvasContext.moveTo(middleX - arrowHeight * Math.cos(angle) - arrowWidth * Math.sin(angle),
                        middleY - arrowHeight * Math.sin(angle) + arrowWidth * Math.cos(angle));
                    globalParam.canvasContext.lineTo(middleX, middleY);
                    globalParam.canvasContext.lineTo(middleX - arrowHeight * Math.cos(angle) + arrowWidth * Math.sin(angle),
                        middleY - arrowHeight * Math.sin(angle) - arrowWidth * Math.cos(angle));

                    globalParam.canvasContext.closePath();
                    globalParam.canvasContext.stroke();
                }

            } else {
                //正常的移动鼠标非拖拽
                //鼠标悬停变色？
            }
        };

        var canvasDragOver = function (ev) {
            //允许拖放
            ev.preventDefault();

        };

        var canvasDrop = function (ev) {
            ev.preventDefault();
            var type = ev.dataTransfer.getData("type");
            var image = ev.dataTransfer.getData("image");
            console.log("竟然拖过来一个" + type);

            var position = getMousePosition(ev);

            var evx = position.x;
            var evy = position.y;
            //不允许图标超出画图框
            evx = (evx > (config.nodeWidth / 2)) ? evx : config.nodeWidth / 2;
            evy = (evy > (config.nodeHeight / 2)) ? evy : config.nodeHeight / 2;
            evx = (evx < (config.canvasWidth - config.nodeWidth / 2)) ? evx : (config.canvasWidth - config.nodeWidth / 2);
            evy = (evy < (config.canvasHeight - config.nodeHeight / 2)) ? evy : (config.canvasHeight - config.nodeHeight / 2);

            //清除其他节点选中状态
            clearAllSelectedNode();
            for (var index = 0; index < plugins.length; index++) {
                var n = plugins[index];
                var nType = n['type'];
                if (type == nType) {
                    var nodeString = n.getXmlContent();
                    var node = $(nodeString).attr("x", (evx - config.nodeWidth / 2)).attr("y", (evy - config.nodeHeight / 2));
                    $(globalParam.xmlContent).find("nodes").append(node);
                    canvasContentDraw();
                }
            }
        };

        var dragStart = function (ev) {
            ev.dataTransfer.setData("type", event.target.id);
            ev.dataTransfer.setData("image", event.target.src);
        };

        var getMousePosition = function (evt) {
            var rect = globalParam.canvas[0].getBoundingClientRect();
            return {
                x: evt.clientX - rect.left * (globalParam.canvas[0].width / rect.width),
                y: evt.clientY - rect.top * (globalParam.canvas[0].height / rect.height)
            }
        }

        //获取选中的节点
        var getSelectedNode = function () {
            var n = null;
            $(globalParam.xmlContent).find("nodes").children("node").each(function (nodeIndex, node) {
                var selected = $(node).attr("selected");
                if (selected == "true") {
                    n = node;
                    return false;
                }
            });
            return n;
        };

        //判断坐标位于哪个节点内
        var getClickNode = function (clientX, clientY) {
            var clickNode = null;
            $(globalParam.xmlContent).find("nodes").children("node").each(function (nodeIndex, node) {
                var x = parseInt($(node).attr("x"));
                var y = parseInt($(node).attr("y"));
                if (clientX > x && clientX < (x + config.nodeWidth) && clientY > y && clientY < (y + config.nodeHeight)) {
                    clickNode = node;
                    return false;
                }
            });
            return clickNode;
        };

        var checkClickNodeDelete = function (nodeName, clientX, clientY) {
            var clickNodeDelete = false;
            $(globalParam.xmlContent).find("nodes").children("node").each(function (nodeIndex, node) {
                var x = parseInt($(node).attr("x"));
                var y = parseInt($(node).attr("y"));
                var name = $(node).children("name").text();
                if (name == nodeName) {
                    //判断鼠标是否在删除按钮上
                    if (clientX > (x + config.nodeWidth - config.radius * 2) && clientX < (x + config.nodeWidth) && clientY > y && clientY < (y + config.radius * 2)) {
                        clickNodeDelete = true;
                    }
                }
            });
            return clickNodeDelete;
        }

        var checkClickHopDelete = function (clientX, clientY) {
            var result = false;
            $(globalParam.xmlContent).find("hops").children("hop").each(function (hopIndex, hop) {     //查找所有nodes节点并遍历
                var startNodeName = $(hop).children("from").text();
                var endNodeName = $(hop).children("to").text();
                var enabled = $(hop).children("enabled").text();
                var evaluation = $(hop).children("evaluation").text();
                var unconditional = $(hop).children("unconditional").text();

                var startNode = getNode(startNodeName);
                var startNodeX = parseInt($(startNode).attr("x"));
                var startNodeY = parseInt($(startNode).attr("y"));
                var startX = startNodeX + config.nodeWidth / 2;
                var startY = startNodeY + config.nodeHeight / 2;

                var endNode = getNode(endNodeName);
                var endNodeX = parseInt($(endNode).attr("x"));
                var endNodeY = parseInt($(endNode).attr("y"));
                var endX = endNodeX + config.nodeWidth / 2;
                var endY = endNodeY + config.nodeHeight / 2;

                //判断点击的位置
                var middleX = (startX + endX) / 2;
                var middleY = (startY + endY) / 2;
                //删除按钮边框
                var deleteArcX = middleX + config.radius;
                var deleteArcY = middleY + config.radius;

                if (clientX > (deleteArcX - config.radius) && clientX < (deleteArcX + config.radius) && clientY > (deleteArcY - config.radius) && clientY < (deleteArcY + config.radius)) {
                    //点中的是删除按钮
                    $(hop).detach();
                    result = true;
                    return false;
                }
            });
            return result;
        }

        var checkClickHopChange = function (clientX, clientY) {
            var result = false;
            $(globalParam.xmlContent).find("hops").children("hop").each(function (hopIndex, hop) {     //查找所有nodes节点并遍历
                var startNodeName = $(hop).children("from").text();
                var endNodeName = $(hop).children("to").text();
                var enabled = $(hop).children("enabled").text();
                var evaluation = $(hop).children("evaluation").text();
                var unconditional = $(hop).children("unconditional").text();

                var startNode = getNode(startNodeName);
                var startNodeX = parseInt($(startNode).attr("x"));
                var startNodeY = parseInt($(startNode).attr("y"));
                var startX = startNodeX + parseInt(config.nodeWidth) / 2;
                var startY = startNodeY + parseInt(config.nodeHeight) / 2;

                var endNode = getNode(endNodeName);
                var endNodeX = parseInt($(endNode).attr("x"));
                var endNodeY = parseInt($(endNode).attr("y"));
                var endX = endNodeX + parseInt(config.nodeWidth) / 2;
                var endY = endNodeY + parseInt(config.nodeHeight) / 2;

                //判断点击的位置
                var middleX = (startX + endX) / 2;
                var middleY = (startY + endY) / 2;
                var conditionArcX = middleX - config.radius;
                var conditionArcY = middleY - config.radius;

                if (clientX > (conditionArcX - config.radius) && clientX < (conditionArcX + config.radius) && clientY > (conditionArcY - config.radius) && clientY < (conditionArcY + config.radius)) {
                    //点中的是条件按钮
                    if (enabled == "N") { //灰色
                        //变黑色
                        $(hop).children("enabled").text("Y");
                        $(hop).children("evaluation").text("Y");
                        $(hop).children("unconditional").text("Y");
                    } else if (enabled == "Y" && unconditional == "Y") { //黑色
                        //变绿色
                        $(hop).children("enabled").text("Y");
                        $(hop).children("evaluation").text("Y");
                        $(hop).children("unconditional").text("N");
                    } else if (enabled == "Y" && unconditional == "N" && evaluation == "Y") { //绿色
                        //变红色
                        $(hop).children("enabled").text("Y");
                        $(hop).children("evaluation").text("N");
                        $(hop).children("unconditional").text("N");
                    } else if (enabled == "Y" && unconditional == "N" && evaluation == "N") { //红色
                        //变灰色
                        $(hop).children("enabled").text("N");
                        $(hop).children("evaluation").text("N");
                        $(hop).children("unconditional").text("N");
                    }
                    result = true;
                    return false;
                }
            });

            return result;
        };

        var getNode = function (nodeName) {
            var n = null;
            $(globalParam.xmlContent).find("nodes").children("node").each(function (nodeIndex, node) {
                var name = $(node).children("name").text();
                if (name == nodeName) {
                    n = node;
                }
            });
            return n;
        }

        var hasHop = function (node1, node2) {
            var has = false;
            $(xmlContent).find("hops").children("hop").each(function (hopIndex, hop) {     //查找所有nodes节点并遍历
                var startN = $(hop).children("from").text();
                var endN = $(hop).children("to").text();
                if ((node1 == startN && node2 == endN) || (node1 == endN && node2 == startN)) {
                    has = true;
                    return false;
                }
            });
            return has;
        }

        var clearAllSelectedNode = function () {
            var result = 0;
            $(globalParam.xmlContent).find("nodes").children("node").each(function (nodeIndex, node) {
                var selected = $(node).attr("selected");
                if (selected == "true") {
                    $(node).attr("selected", "false");
                    result++;
                }

            });
            return result;
        };

        var deleteNode = function (nodeName) {
            $(globalParam.xmlContent).find("nodes").children("node").each(function (nodeIndex, node) {
                var name = $(node).children("name").text();
                if (name == nodeName) {
                    $(node).detach();
                    return;
                }
            });

        };

        var deleteNodeHops = function (nodeName) {
            $(globalParam.xmlContent).find("hops").children("hop").each(function (hopIndex, hop) {
                var startNode = $(hop).children("from").text();
                var endNode = $(hop).children("to").text();
                if (startNode == nodeName || endNode == nodeName) {
                    $(hop).detach();
                }
            });
        }

        var canvasContentDraw = function () {
            //清理画板
            globalParam.canvasContext.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
            //画图标
            $(globalParam.xmlContent).find("nodes").children("node").each(function (nodeIndex, node) {     //查找所有nodes节点并遍历
                var type = $(node).children("type").text();
                var name = $(node).children("name").text();
                var label = $(node).children("properties").children("label").text();
                var x = parseInt($(node).attr("x"));
                var y = parseInt($(node).attr("y"));
                var selected = $(node).attr("selected");
                var control = new Image();
                control.src = $(node).attr("image");
                control.onload = function () {
                    globalParam.canvasContext.drawImage(control, x, y, config.nodeWidth, config.nodeHeight);
                    if (selected == "true") {
                        globalParam.canvasContext.strokeStyle = "blue";
                    } else {
                        globalParam.canvasContext.strokeStyle = "black";
                    }

                    //画节点边框
                    globalParam.canvasContext.lineWidth = 1;
                    globalParam.canvasContext.strokeRect(x, y, config.nodeWidth, config.nodeHeight);

                    //画节点名称
                    var textWidth = globalParam.canvasContext.measureText(label).width;
                    globalParam.canvasContext.strokeText(label, x + parseInt(config.nodeWidth) / 2 - (textWidth / 2), y + config.nodeHeight + 12);

                    //选中状态下可以删除
                    if (selected == "true") {
                        //画删除按钮边框
                        var arcX = x + parseInt(config.nodeWidth) - parseInt(config.radius);
                        var arcY = y + parseInt(config.radius);
                        globalParam.canvasContext.beginPath();
                        globalParam.canvasContext.fillStyle = '#c3c3c3';
                        globalParam.canvasContext.arc(arcX, arcY, config.radius, 0, Math.PI * 2, true);
                        globalParam.canvasContext.closePath();
                        globalParam.canvasContext.fill();
                        //画删除按钮X
                        globalParam.canvasContext.beginPath();
                        globalParam.canvasContext.lineWidth = 1;
                        globalParam.canvasContext.strokeStyle = "brown";
                        globalParam.canvasContext.moveTo(arcX - config.radius * 0.5, arcY - config.radius * 0.5);
                        globalParam.canvasContext.lineTo(arcX + config.radius * 0.5, arcY + config.radius * 0.5);
                        globalParam.canvasContext.moveTo(arcX - config.radius * 0.5, arcY + config.radius * 0.5);
                        globalParam.canvasContext.lineTo(arcX + config.radius * 0.5, arcY - config.radius * 0.5);
                        globalParam.canvasContext.closePath();
                        globalParam.canvasContext.stroke();
                    }
                }
            });

            //画带箭头连线
            $(globalParam.xmlContent).find("hops").children("hop").each(function (hopIndex, hop) {     //查找所有nodes节点并遍历
                var startNodeName = $(hop).children("from").text();
                var endNodeName = $(hop).children("to").text();
                var enabled = $(hop).children("enabled").text();
                var evaluation = $(hop).children("evaluation").text();
                var unconditional = $(hop).children("unconditional").text();

                var startNode = getNode(startNodeName);
                var startNodeX = parseInt($(startNode).attr("x"));
                var startNodeY = parseInt($(startNode).attr("y"));
                var startX = startNodeX + config.nodeWidth / 2;
                var startY = startNodeY + config.nodeHeight / 2;

                var endNode = getNode(endNodeName);
                var endNodeX = parseInt($(endNode).attr("x"));
                var endNodeY = parseInt($(endNode).attr("y"));
                var endX = endNodeX + config.nodeWidth / 2;
                var endY = endNodeY + config.nodeHeight / 2;


                //=====画连线=====
                globalParam.canvasContext.beginPath();
                globalParam.canvasContext.lineWidth = config.hopWidth;
                if (enabled == "N") {
                    globalParam.canvasContext.strokeStyle = "gray";
                } else if (unconditional == "Y") {
                    globalParam.canvasContext.strokeStyle = "black";
                } else if (evaluation == "Y") {
                    globalParam.canvasContext.strokeStyle = "green";
                } else {
                    globalParam.canvasContext.strokeStyle = "red";
                }

                globalParam.canvasContext.moveTo(startX, startY);
                globalParam.canvasContext.lineTo(endX, endY);

                //画箭头
                var middleX = (startX + endX) / 2;
                var middleY = (startY + endY) / 2;
                var arrowHeight = config.arrowHeight;
                var arrowWidth = config.arrowWidth;
                var angle = Math.atan2(endY - startY, endX - startX);

                globalParam.canvasContext.moveTo(middleX - arrowHeight * Math.cos(angle) - arrowWidth * Math.sin(angle),
                    middleY - arrowHeight * Math.sin(angle) + arrowWidth * Math.cos(angle));
                globalParam.canvasContext.lineTo(middleX, middleY);
                globalParam.canvasContext.lineTo(middleX - arrowHeight * Math.cos(angle) + arrowWidth * Math.sin(angle),
                    middleY - arrowHeight * Math.sin(angle) - arrowWidth * Math.cos(angle));

                globalParam.canvasContext.closePath();
                globalParam.canvasContext.stroke();

                //画条件按钮
                var conditionArcX = middleX - config.radius;
                var conditionArcY = middleY - config.radius;
                globalParam.canvasContext.beginPath();
                globalParam.canvasContext.fillStyle = globalParam.canvasContext.strokeStyle;
                globalParam.canvasContext.arc(conditionArcX, conditionArcY, config.radius, 0, Math.PI * 2, true);
                globalParam.canvasContext.closePath();
                globalParam.canvasContext.fill();

                //画删除按钮边框
                var deleteArcX = middleX + config.radius;
                var deleteArcY = middleY + config.radius;
                globalParam.canvasContext.beginPath();
                globalParam.canvasContext.fillStyle = '#c3c3c3';
                globalParam.canvasContext.arc(deleteArcX, deleteArcY, config.radius, 0, Math.PI * 2, true);
                globalParam.canvasContext.closePath();
                globalParam.canvasContext.fill();
                //画删除按钮X
                globalParam.canvasContext.beginPath();
                globalParam.canvasContext.lineWidth = config.hopWidth;
                globalParam.canvasContext.strokeStyle = "brown";
                globalParam.canvasContext.moveTo(deleteArcX - config.radius * 0.5, deleteArcY - config.radius * 0.5);
                globalParam.canvasContext.lineTo(deleteArcX + config.radius * 0.5, deleteArcY + config.radius * 0.5);
                globalParam.canvasContext.moveTo(deleteArcX - config.radius * 0.5, deleteArcY + config.radius * 0.5);
                globalParam.canvasContext.lineTo(deleteArcX + config.radius * 0.5, deleteArcY - config.radius * 0.5);
                globalParam.canvasContext.closePath();
                globalParam.canvasContext.stroke();
            });
        };


        // 提供外部函数 导出 xml 内容
        _self.getXmlContent = function () {
            return globalParam.xmlContent;
        };

        _self.drawLine = function () {
            globalParam.onDrawLine = true;
        }

        //供给外部回调 用于设置文本域内容
        _self.setTextAreaValue = function () {
            if (typeof textAreaClick == "function") {
                return textAreaClick();
            }
            return "";
        }

        //供给外部回调 用户设置输入框内容
        _self.setInputValue = function () {
            if (typeof inputClick == "function") {
                return inputClick();
            }
            return "";
        }

        var plugins = [
            {
                type: "start",
                name: "start",
                x: 0,
                y: 0,
                selected: false,
                image: "images/start.jpg",
                properties: {
                    label: "start"
                },
                getXmlContent: function () {
                    //生成node节点字符串
                    var nodeString =
                        '<node selected="true" x="0" y="0" image="' + this.image + '">\n' +
                        '<type>' + this.type + '</type>\n' +
                        '<name>' + this.type + '_' + new Date().getMilliseconds() + '</name>\n' +
                        '<properties>' +
                        '<label title="名称" description="节点名称">' + this.type + '</label>\n' +
                        '</properties>' +
                        '</node>';
                    return nodeString;
                }
            },
            {
                type: "hive",
                name: "hive",
                x: 0,
                y: 0,
                selected: false,
                image: "images/hive.png",
                properties: {
                    label: "hive",
                    sql: ""
                },
                getXmlContent: function () {
                    //生成node节点字符串
                    var nodeString =
                        '<node selected="true" x="0" y="0" image="' + this.image + '">\n' +
                        '<type>' + this.type + '</type>\n' +
                        '<name>' + this.type + '_' + new Date().getMilliseconds() + '</name>\n' +
                        '<properties>' +
                        '<label title="名称" description="节点名称">' + this.type + '</label>\n' +
                        '<sql title="sql" description="选择一个sql文件运行"></sql>\n' +
                        '</properties>' +
                        '</node>';
                    return nodeString;
                }
            },
            {
                type: "success",
                name: "success",
                x: 0,
                y: 0,
                selected: false,
                image: "images/success.jpg",
                properties: {
                    label: "success"
                },
                getXmlContent: function () {
                    //生成node节点字符串
                    var nodeString =
                        '<node selected="true" x="0" y="0" image="' + this.image + '">\n' +
                        '<type>' + this.type + '</type>\n' +
                        '<name>' + this.type + '_' + new Date().getMilliseconds() + '</name>\n' +
                        '<properties>' +
                        '<label title="名称" description="节点名称">' + this.type + '</label>\n' +
                        '</properties>' +
                        '</node>';
                    return nodeString;
                }
            }
        ];

        // 启动插件
        _init();
        // 链式调用
        return this;
    };

    var workflowNode = function (type, label, x, y) {
        this.attr.x = x;
        this.attr.y = y;
        this.attr.selected = "false";

        this.type.attribute.readonly = "true";
        this.type.attribute.type = "text";
        this.type.attribute.title = "节点类型";
        this.type.attribute.description = "不可更改";
        this.type.attribute.content = type;

        this.name.attribute.readonly = "true";
        this.name.attribute.type = "text";
        this.name.attribute.title = "节点id";
        this.name.attribute.description = "不可更改";
        this.name.attribute.content = type;

        this.label.attribute.readonly = "false";
        this.label.attribute.type = "text";
        this.label.attribute.title = "节点名称";
        this.label.attribute.description = "节点名称";
        this.label.attribute.content = label;

        this.image = new Image();
        this.image.src = "images/" + type + ".png";

        var workflowNodeSelf = this;


        this.getXmlContent = function () {
            var xmlContent = $("<node></node>");
            $(xmlContent).attr("x", workflowNodeSelf.attr.x);
            $(xmlContent).attr("y", workflowNodeSelf.attr.y);
            $(xmlContent).attr("selected", workflowNodeSelf.attr.selected);

            var type = $('<type></type>');
            $(type).attr("readonly", workflowNodeSelf.type.attribute.readonly);
            $(type).attr("type", workflowNodeSelf.type.attribute.type);
            $(type).attr("title", workflowNodeSelf.type.attribute.title);
            $(type).attr("description", workflowNodeSelf.type.attribute.description);
            $(type).html(workflowNodeSelf.type.attribute.content);

            var name = $('<name></name>');
            $(name).attr("readonly", workflowNodeSelf.name.attribute.readonly);
            $(name).attr("type", workflowNodeSelf.name.attribute.type);
            $(name).attr("title", workflowNodeSelf.name.attribute.title);
            $(name).attr("description", workflowNodeSelf.name.attribute.description);
            $(name).html(workflowNodeSelf.name.attribute.content);

            var label = $('<label></label>');
            $(label).attr("readonly", workflowNodeSelf.label.attribute.readonly);
            $(label).attr("type", workflowNodeSelf.label.attribute.type);
            $(label).attr("title", workflowNodeSelf.label.attribute.title);
            $(label).attr("description", workflowNodeSelf.label.attribute.description);
            $(label).html(workflowNodeSelf.label.attribute.content);

            $(xmlContent).append(type);
            $(xmlContent).append(name);
            $(xmlContent).append(label);

            return $(xmlContent)[0].outerHTML;
        }

        this.initFromXml = function (xmlContent) {

        }


    }

    var hiveNode = function (x, y) {
        workflowNode.call("hive", "hive", x, y);
    }

    var startNode = function (x, y) {
        workflowNode.call("start", "开始", x, y);
    }

    var successNode = function (x, y) {
        workflowNode.call("success", "成功", x, y);
    }

})
(jQuery, window);


