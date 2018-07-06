# Conway's Game of Life

### Demo

https://s3-ap-southeast-1.amazonaws.com/shendy-conways-game-of-life/index.html

### Overview

Object `Universe` is a world of arbitrary dimension. `TwoDimensionUniverse` extends Universe. Another dimension of universe can easily extend Universe and just need to implement a method to decide how next generation advances. I use Cartesian Power to get neighbors of a point in n-dimension world. I also create a separate object called `TwoDimensionUi` to decople game logic and UI.

## Authors

* **Shendy Kurnia** - [https://github.com/shendykurnia](https://github.com/shendykurnia)