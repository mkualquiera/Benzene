var canvasElem = document.getElementById("mycanvas");
canvasElem.width = window.innerWidth;
canvasElem.height = window.innerHeight;

window.onresize = () => {
    canvasElem.width = window.innerWidth;
    canvasElem.height = window.innerHeight;
}

graph = new LGraph();
var canvas = new LGraphCanvas("#mycanvas", graph);
var extcon = console;

LiteGraph.clearRegisteredTypes();
graph.config.nodeCount = 0;

var newNodeName = "";

var typeColors = {
    input: {
        bgcolor: "#415030",
        color: "#293020"
    },
    error: {
        bgcolor: "#533",
        color: "#322"
    },
    output: {
        bgcolor: "#305045",
        color: "#20302b",
    }
}

function InternalNode() {
    var thisName = "Node" + graph.config.nodeCount;
    if (newNodeName != "") {
        thisName = newNodeName;
    }
    thisName = thisName.replaceAll(" ", "_");
    graph.config.nodeCount += 1;
    this.properties = { f: "" }
    this.title = thisName;
    this.flags = {}
    this.addInput("New input", "number");
    this.addOutput("Outputs", "number");
    this.addWidget("text", "name", thisName, (value) => {
        var oldname = this.title;
        this.title = value;
        console.log(this.outputs[0].links);
        console.log(this.graph);
        if (this.outputs[0].links) {
            for (var i = 0; i < this.outputs[0].links.length; i++) {
                console.log(i);
                var target_id = this.graph.links[this.outputs[0].links[i]].target_id;
                var target_node = this.graph.getNodeById(target_id);
                for (var j = 0; j < target_node.inputs.length; j++) {
                    if (target_node.inputs[j].name == oldname) {
                        target_node.inputs[j].name = value;
                    }
                }
            }
        }
    });
    this.exprField = this.addWidget("text", "f", "", (value) => {
        this.properties.f = value;
        this.updateType();
    });
    //exprField.options.multiline = true;
    this.serialize_widgets = true;
    this.updateType();
}

InternalNode.prototype.isfValid = function () {
    for (var i = 0; i < this.inputs.length; i++) {
        if (this.inputs[i].name == "New input") continue;
        console.log(this.properties.f, this.inputs[i].name);
        if (!this.properties.f.includes(this.inputs[i].name)) {
            return false;
        }
    }
    return true;
}

InternalNode.prototype.updateColor = function () {
    console.log(typeColors);
    if (this.flags.type in typeColors) {
        this.color = typeColors[this.flags.type].color;
        this.bgcolor = typeColors[this.flags.type].bgcolor;
    } else {
        delete this.color;
        delete this.bgcolor;
    }
}

InternalNode.prototype.updateType = function () {
    if (this.inputs.length <= 1 && this.properties.f.length == 0) {
        this.flags.type = "input";
    } else {
        if (this.isfValid()) {
            if (this.outputs[0].links && this.outputs[0].links.length > 0) {
                this.flags.type = "normal";
            } else {
                this.flags.type = "output";
            }
        } else {
            console.log(this);
            this.flags.type = "error";
        }
    }
    console.log(this);
    this.updateColor();
}

InternalNode.title = "Internal";
InternalNode.shape = LiteGraph.BOX_SHAPE;

function inner_value_change(widget, value) {
    widget.value = value;
    if (widget.options && widget.options.property && node.properties[widget.options.property] !== undefined) {
        node.setProperty(widget.options.property, value);
    }
    if (widget.callback) {
        widget.callback(widget.value, that, node, pos, event);
    }
}

InternalNode.prototype.onAdded = function (e) {
    for (var nodeId in this.graph._nodes) {
        var node = graph._nodes[nodeId];
        if (!(node === this) && node.title == this.title) {
            this.graph.remove(this);
        }
    }
}

InternalNode.prototype.onDblClick = function (e) {
    var exprField = this.exprField;
    canvas.prompt("Value", exprField.value, (value) => {
        exprField.value = value;
        inner_value_change(exprField, value);
    }, e, false);
    console.log(this);
}

InternalNode.prototype.onConnectionsChange = function (type, slot, connected, link_info, input_info) {
    if (type == LiteGraph.INPUT && connected == false) {
        this.removeInput(slot);
    }
    this.updateType();
}

InternalNode.prototype.onConnectInput = function (in_slot, type, link_info, other_node, out_slot) {
    var count = 0;
    for (var i = 0; i < this.inputs.length; i++) {
        if (this.inputs[i].name == other_node.title) {
            return false;
        }
    }
    this.inputs[in_slot].name = other_node.title;
    this.addInput("New input", "number");
    return true;
}

LiteGraph.registerNodeType("internal", InternalNode);

canvas.onDoubleClick = function (e) {
    canvas.prompt("Node name", "", (value) => {
        newNodeName = value;
        var node = LiteGraph.createNode("internal");
        node.pos = canvas.convertEventToCanvasOffset(
            e
        );
        canvas.graph.add(node);
    }, e, false);
    return false;
}

//canvas.allow_searchbox = false;

graph.start()