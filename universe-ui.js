if (Universe) {
    if (TwoDimensionUniverse) {
        var TwoDimensionUi = function(universe, canvas, options) {
            if (!(universe instanceof TwoDimensionUniverse)) {
                throw 'expected TwoDimensionUniverse';
            }

            this.wrapper_class = 'univer-ui-' + (new Date()).getTime();
            $(canvas).css({
                position: 'absolute',
                top: 0,
                left: 0,
                width: options.dimension_px + 'px',
                height: options.dimension_px + 'px'
            }).addClass(this.wrapper_class);

            this.options = options;

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
            iterate(universe.lifes, function(position) {
                self.draw(position);
            });
        };

        TwoDimensionUi.prototype.update = function(updates) {
            for (var i = 0; i < updates.length; i++) {
                var update = updates[i];
                if (update.action == universe.Update.ACTION_KILL) {
                    this.erase(update.position);
                } else if (update.action == universe.Update.ACTION_SPAWN) {
                    this.draw(update.position);
                }
            }
        };

        TwoDimensionUi.prototype.draw = function(position) {
            var dimension_px = Math.floor(this.options.dimension_px / this.options.dimension_num_boxes);
            $('.' + this.wrapper_class)
                .append($('<div>')
                    .addClass('pos-' + position[0] + '-' + position[1])
                    .css({
                        position: 'absolute',
                        top: (position[1] * dimension_px) + 'px',
                        left: (position[0] * dimension_px) + 'px',
                        background: '#000',
                        width: dimension_px + 'px',
                        height: dimension_px + 'px'
                    }));
        };

        TwoDimensionUi.prototype.erase = function(position) {
            $('.' + this.wrapper_class + ' .pos-' + position[0] + '-' + position[1]).remove();
        };
    }
}