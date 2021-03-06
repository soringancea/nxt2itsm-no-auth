const utils = require('../utils/utils');

module.exports = class normalization {
    constructor(jsonNorm, type, format) {
        this._type = type;
        this._format = format;
        this._content = this.getContent(jsonNorm.elements, this._type);
    };

    get format() {
        return this._format;
    };

    getContent(arrayJson, type) {
        var elements = [];

        switch (type) {
            case 'Enums':
            case 'Strings':
                for (index in arrayJson) {
                    var norm = {
                        label: '',
                        value: ''
                    };
                    if (arrayJson[index].attributes.Label) {
                        norm.label = arrayJson[index].attributes.Label;
                    };
                    norm.value = arrayJson[index].attributes.Value;

                    elements.push(norm);
                };
                break;
            case 'Ranges':
                for (index in arrayJson) {
                    var norm = {
                        label: '',
                        from: '',
                        to: ''
                    };
                    if (arrayJson[index].attributes) {
                        norm.label = arrayJson[index].attributes.Label;
                    };

                    var ranges = arrayJson[index].elements;

                    for (var index2 in ranges) {
                        if (ranges[index2].name === 'From') {
                            norm.from = ranges[index2].attributes.Value;
                        } else if (ranges[index2].name === 'To') {
                            norm.to = ranges[index2].attributes.Value;
                        };
                    }
                    elements.push(norm);
                };
                break;
        };
        return elements;
    };

    applyNorm(payload) {
        console.log('Applying normalization to:\t', payload);
        switch (this._type) {
            case 'Enums':
                for (index in this._content) {
                    if (payload === this._content[index].value && this._content[index].label) {
                        return this._content[index].label;
                    };
                };
                break;
            case 'Strings':
                for (index in this._content) {
                    var exp = this._content[index].value.replace(/[\-\[\]\/\{\}\(\)\+\.\\\^\$\|]/g, "\\$&");
                    exp = exp.replace(/\*/g, '.*').replace(/\?/g, '\\w');
                    var regexp = new RegExp(exp);
                    if (regexp.test(payload) && this._content[index].label) {
                        return this._content[index].label;
                    };
                };
                break;
            case 'Ranges':
                var label;
                var numPayload = parseFloat(payload);
                for (index in this._content) {
                    var range = this._content[index];
                    var rangeFrom = parseFloat(range.from);

                    console.log('Current range:\t', range);
                    if (numPayload >= rangeFrom) {
                        console.log(numPayload, 'higher or equal to', rangeFrom);
                        if (range.to) {
                            var rangeTo = parseFloat(range.to);
                            if (numPayload < rangeTo) {
                                console.log(numPayload, 'smaller to', rangeTo);
                                if (range.label) {
                                    return range.label;
                                } else {
                                    return utils.transform(payload, this._format);
                                };
                            };
                        } else {
                            console.log('no \'to\' value')
                            if (range.label) {
                                console.log('label found:', range.label);
                                label = range.label;
                            };
                        };
                    };
                };
                if (label) {
                    console.log('returning label:', label);
                    return label;
                };
                break;
        };
        return utils.transform(payload, this._format);
    };
};