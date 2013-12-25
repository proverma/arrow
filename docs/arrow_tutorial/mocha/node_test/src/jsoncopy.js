/*
 * Make a deep copy of the supplied object. This function reliably copies only
 * what is valid for a JSON object, array, or other element.
 */
var deepCopy = function (o) {
    var newArr, ix, newObj, prop;

    if (!o || typeof o !== 'object') {
        return o;
    }
    if (Array.isArray(o)) {
        newArr = [];
        for (ix = 0; ix < o.length; ix += 1) {
            newArr.push(deepCopy(o[ix]));
        }
        return newArr;
    } else {
        newObj = {};
        for (prop in o) {
            if (o.hasOwnProperty(prop)) {
                newObj[prop] = deepCopy(o[prop]);
            }
        }
        return newObj;
    }
};

/*
 * Make a shallow (i.e. top level only) copy of the supplied object. This
 * function reliably copies only what is valid for a JSON object, array, or
 * other element.
 */
var shallowCopy = function (o) {
    var newObj, prop;

    if (!o || typeof o !== 'object') {
        return o;
    }
    if (Array.isArray(o)) {
        return o.slice(0);
    } else {
        newObj = {};
        for (prop in o) {
            if (o.hasOwnProperty(prop)) {
                newObj[prop] = o[prop];
            }
        }
        return newObj;
    }
};

/*
 * Make a copy of the supplied object, either shallow or deep, according to the
 * second argument. This function reliably copies only what is valid for a JSON
 * object, array, or other element.
 */
var copy = function (o, shallow) {
    var copyfn = shallow ? shallowCopy : deepCopy;

    return copyfn(o);
};

exports.deepCopy = deepCopy;
exports.shallowCopy = shallowCopy;
exports.copy = copy;

