var Universe = function(seed) {
    this.LIFE_DEAD = 0;
    this.LIFE_ALIVE = 1;

    /*
    data structure is dictionary representing alive cells with their position as keys
    the number of universe dimensions can be arbitrary
    eg:
    {
        1: {
            2: true
        },
        3: {
            4: true
        }
    }
    */
    this.lifes = {};

    var spawn = function(obj, position) {
        if (position.length == 0) {
            return;
        }

        if (position.length == 1) {
            obj[position[0]] = true;
            return;
        }

        var pos = position[0];
        if (!(pos in obj)) {
            obj[pos] = {};
        }
        spawn(obj[pos], position.slice(1));
    };
    this.spawn = spawn;

    var kill = function(obj, position) {
        if (position.length == 0) {
            return;
        }

        if (!(position[0] in obj)) {
            return;
        }

        if (position.length == 1) {
            delete obj[position[0]];
            return;
        }

        kill(obj[position[0]], position.slice(1));
    };
    this.kill = kill;

    var is_alive_at_position = function(obj, position) {
        if (position.length == 0) {
            return false;
        }

        if (!(position[0] in obj)) {
            return false;
        }

        if (position.length == 1) {
            return true;
        }

        return is_alive_at_position(obj[position[0]], position.slice(1));
    };

    // internal 'class' to define object structure that should be returned by Universe.process()
    this.Update = function(position, action) {
        this.position = position;
        this.action = action;
    };

    this.Update.ACTION_DO_NOTHING = 0;
    this.Update.ACTION_SPAWN = 1;
    this.Update.ACTION_KILL = 2;

    var cached = {};
    var cartesian_power = function(s, N) {
        var hash = JSON.stringify(s) + '' + N;
        if (hash in cached) {
            return cached[hash];
        }

        if (N <= 0) {
            return [];
        }

        var result = [];
        for (var i = 0; i < N; i++) {
            if (i == 0) {
                var _result = [];
                for (var j = 0; j < s.length; j++) {
                    _result.push([s[j]]);
                }
                result = _result;
            } else {
                var _result = [];
                for (var j = 0; j < result.length; j++) {
                    for (var k = 0; k < s.length; k++) {
                        _result.push(result[j].concat(s[k]));
                    }
                }
                result = _result;
            }
        }

        cached[hash] = result;

        return result;
    };

    var get_tree_depth = function(t, depth) {
        if (!depth) {
            depth = 0;
        }

        if (!t || typeof value == 'object') {
            return depth;
        }

        var max_depth = depth;
        for (var key in t) {
            var value = t[key];
            if (typeof value == 'object') {
                max_depth = Math.max(max_depth, get_tree_depth(value, depth + 1));
            } else {
                max_depth = Math.max(max_depth, depth + 1);
            }
        }

        return max_depth;
    };

    var universe = this;
    this.get_neighbor_positions = function(state, position) {
        if (position.length == 0) {
            return [];
        }

        var neighbor_positions = [];
        var cartesian = cartesian_power([-1, 0, 1], get_tree_depth(this.lifes));
        for (var i = 0; i < cartesian.length; i++) {
            var _cartesian = cartesian[i];
            var is_all_zeroes = true;
            for (var j = 0; j < _cartesian.length; j++) {
                if (0 != _cartesian[j]) {
                    is_all_zeroes = false;
                    break;
                }
            }
            if (is_all_zeroes) {
                continue;
            }
            var neighbour_position = position.slice();
            for (var j = 0; j < neighbour_position.length; j++) {
                neighbour_position[j] = parseInt(neighbour_position[j]) + _cartesian[j];
            }
            var is_alive = is_alive_at_position(universe.lifes, neighbour_position);
            if ((state == universe.LIFE_ALIVE && is_alive) || (state == universe.LIFE_DEAD && !is_alive)) {
                neighbor_positions.push(neighbour_position);
            }
        }

        return neighbor_positions;
    };

    // deep copy seed
    var _seed = JSON.parse(JSON.stringify(seed));
    for (var i = 0; i < _seed.length; i++) {
        spawn(this.lifes, _seed[i]);
    }
};

Universe.prototype.process = function() {
    throw 'this function should not be called';
};

Universe.prototype.tick = function() {
    /*
    For this setup
    {
        1: {
            2: true
        },
        3: {
            4: true
        }
    }
    This function will call the callback function with the leaf's positions as arguments, ie
    [1, 2]
    [3, 4]
    */
    var iterate = function(map, callback, callback_args) {
        if (!callback_args) {
            callback_args = [];
        }

        for (var key in map) {
            var value = map[key];
            if (typeof value == 'object') {
                iterate(map[key], callback, callback_args.concat([key]));
            } else {
                callback(callback_args.concat([key]));
            }
        }
    };

    var self = this;
    var updates = [];
    iterate(this.lifes, function(position) {
        var update = self.process(self.LIFE_ALIVE, position);
        if (update) {
            if (!(update instanceof self.Update)) {
                throw 'invalid update object returned by process()';
            }
            updates.push(update);
        }

        var dead_neighbor_positions = self.get_neighbor_positions(self.LIFE_DEAD, position);
        for (var i = 0; i < dead_neighbor_positions.length; i++) {
            var update = self.process(self.LIFE_DEAD, dead_neighbor_positions[i]);
            if (!update) {
                continue;
            }
            if (!(update instanceof self.Update)) {
                throw 'invalid update object returned by process()';
            }
            updates.push(update);
        }
    });

    // remove duplicates
    var normalized = [];
    var tmp = {};
    for (var i = 0; i < updates.length; i++) {
        var update = updates[i];
        var hash = JSON.stringify(update);
        if (hash in tmp) {
            continue;
        }

        tmp[hash] = true;
        normalized.push(update);
    }
    updates = normalized;

    for (var i = 0; i < updates.length; i++) {
        var update = updates[i];
        if (update.action == this.Update.ACTION_KILL) {
            this.kill(this.lifes, update.position);
        } else if (update.action == this.Update.ACTION_SPAWN) {
            this.spawn(this.lifes, update.position);
        }
    }

    return updates;
};

// extend Universe
var TwoDimensionUniverse = function(seed) {
    Universe.call(this, seed);
};

TwoDimensionUniverse.prototype = Object.create(Universe.prototype);

TwoDimensionUniverse.prototype.constructor = TwoDimensionUniverse;

TwoDimensionUniverse.prototype.process = function(is_alive, position) {
    if (position.length != 2) {
        return null;
    }
    /*
    Any live cell with fewer than two live neighbours dies, as if caused by underpopulation.
    Any live cell with two or three live neighbours lives on to the next generation.
    Any live cell with more than three live neighbours dies, as if by overpopulation.
    Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
    */

    var live_neighbor_positions = this.get_neighbor_positions(this.LIFE_ALIVE, position);
    if (is_alive === this.LIFE_ALIVE && (live_neighbor_positions.length < 2 || live_neighbor_positions.length > 3)) {
        return new this.Update(position, this.Update.ACTION_KILL);
    } else if (is_alive === this.LIFE_DEAD && live_neighbor_positions.length == 3) {
        return new this.Update(position, this.Update.ACTION_SPAWN);
    }

    return null;
};