/**
 * Created by xushanshan on 16/3/9.
 */
(function ($, window) {

    // 插件定义
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
            onDrawLine: false
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
            globalParam.canvas = $('<canvas></canvas>').attr("width", parseInt(config.canvasWidth)).attr("height", parseInt(config.canvasHeight)).attr("style", "border:1px solid #c3c3c3;");
            globalParam.canvasContext = globalParam.canvas[0].getContext("2d");

            $(_self).append(globalParam.canvas);


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
                    var evx = mouseXToCanvasX(parseInt(ev.clientX));
                    var evy = mouseYToCanvasY(parseInt(ev.clientY));
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
                    globalParam.canvas.attr("style", 'border:1px solid #c3c3c3;');
                    clearAllSelectedNode();
                    $(endNode).attr("selected", "true");

                } else {
                    var evx = mouseXToCanvasX(parseInt(ev.clientX));
                    var evy = mouseYToCanvasY(parseInt(ev.clientY));
                    var selectedNode = getClickNode(evx, evy);
                    if (selectedNode != null) {
                        //点击的是节点
                        var selected = $(selectedNode).attr("selected");
                        var name = $(selectedNode).children("name").text();
                        if (selected == "true") {
                            //判断鼠标是否在删除按钮上
                            var isDelete = checkClickNodeDelete(name, evx, evy);
                            if (isDelete == true) {
                                deleteNode(name);
                                deleteNodeHops(name);
                            } else {
                                //重新点击了一个选中的节点
                                //清除所有选中的节点
                                clearAllSelectedNode();
                                //设置这个节点为新的被选中的节点
                                $(selectedNode).attr("selected", "true");

                                //可能是拖拽
                                globalParam.mouseDragNode = selectedNode;
                            }
                        } else {
                            //点击的是一个未选中的节点
                            //清除所有选中的节点
                            clearAllSelectedNode();
                            //设置这个节点为新的被选中的节点
                            $(selectedNode).attr("selected", "true");

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
                                clearAllSelectedNode();
                                //取消拖拽
                                globalParam.mouseDragNode = null;
                            }
                        }
                    }
                }

            } else if (ev.button == 1) {
                // 点击了滑轮
            } else if (ev.button == 2) {
                //点击了右键
            }
            canvasContentDraw();
        };

        var canvasOnMouseUp = function (event) {
            //如果选中的是节点 属性框显示这个节点的属性

            globalParam.mouseDragNode = null;
            canvasContentDraw();
        };

        var canvasMouseMove = function (ev) {
            if (globalParam.mouseDragNode != null) {
                var evx = mouseXToCanvasX(parseInt(ev.clientX));
                var evy = mouseYToCanvasY(parseInt(ev.clientY));
                //不允许图标超出画图框
                evx = (evx > 20) ? evx : 20;
                evy = (evy > 20) ? evy : 20;
                evx = (evx < config.canvasWidth - 20) ? evx : config.canvasWidth - 20;
                evy = (evy < config.canvasHeight - 20) ? evy : config.canvasHeight - 20;

                $(globalParam.mouseDragNode).attr("x", evx - 20);
                $(globalParam.mouseDragNode).attr("y", evy - 20);

                canvasContentDraw();
            } else {
                //正常的移动鼠标非拖拽
                //鼠标悬停变色？
            }
        };

        var canvasDragOver = function (event) {
            alert("canvasDragOver");
        };

        var canvasDrop = function (event) {
            alert("canvasDrop");
        };

        var dragStart = function (event) {
            alert("dragStart");
        };

        var mouseXToCanvasX = function (mouseX) {
            var canvasOffsetLeft = globalParam.canvas[0].offsetLeft;
            return parseInt(mouseX) - parseInt(canvasOffsetLeft);
        };

        var mouseYToCanvasY = function (mouseY) {
            var canvasOffsetTop = globalParam.canvas[0].offsetTop;
            return parseInt(mouseY) - parseInt(canvasOffsetTop);
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
            $(globalParam.xmlContent).find("nodes").children("node").each(function (nodeIndex, node) {
                $(node).attr("selected", "false");
            });
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
                var label = $(node).children("label").text();
                var x = parseInt($(node).attr("x"));
                var y = parseInt($(node).attr("y"));
                var selected = $(node).attr("selected");
                var img = document.getElementById(type);
                var control = new Image();
                control.src = img.getAttribute("src");
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
            globalParam.canvas.attr("style", 'border:1px solid #c3c3c3; cursor: url("images/arrow.png") 26 13, move;');
        }

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
        this.name.attribute.content = type + "_" + getTimeString();

        this.label.attribute.readonly = "false";
        this.label.attribute.type = "text";
        this.label.attribute.title = "节点名称";
        this.label.attribute.description = "节点名称";
        this.label.attribute.content = label;

        this.image = new Image();
        this.image.src = "images/" + type + ".png";

        var workflowNodeSelf = this;

        //私有方法 返回时间字符串 yyyyMMDDHHmmssSSS
        var getTimeString = function () {
            var now = new Date();
            return "" + (1900 + now.getFullYear()) + (1 + now.getMonth()) + now.getDate() + now.getHours() + now.getMinutes() + now.getMilliseconds();
        }

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
    }

    var hiveWorkflowNode = function (x, y) {
        workflowNode.call("hive", "hive", x, y);

    }

    var startWorkflowNode = function (x, y) {
        workflowNode.call("start", "开始", x, y);
    }

    var successWorkflowNode = function (x, y) {
        workflowNode.call("success", "成功", x, y);
    }


})
(jQuery, window);

