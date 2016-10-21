var Preyon = Preyon || (function () {

        var $canvas, _ctx,
            _isPoint = 0,
            _points, _close, _open,
            _toothW = 200, _toothH = 160, _teethTotal = 10,
            _toothW2 = _toothW >> 1,
            _moveX = 0, _moveY = 0, _offsetX = 0, _offsetY = 0,
            _isDown = 0, _guide = {y:0.4},
            _sw, _sh, _cx, _cy, _raf;

        function init() {
            $canvas = document.getElementsByTagName('canvas')[0];

            initEvent();
            initController();

            _raf = window.requestAnimationFrame(animate);
        }

        function initEvent() {
            $canvas.addEventListener('mousedown', onDown, false);
            $canvas.addEventListener('mousemove', onMove, false);
            $canvas.addEventListener('mouseup', onUp, false);

            if (!!('ontouchstart' in window)) {
                $canvas.addEventListener('touchstart', touchStart, false);
                $canvas.addEventListener('touchmove', touchMove, false);
                $canvas.addEventListener('touchend', touchEnd, false);
            }

            window.addEventListener('resize', onResize, true);
            onResize();
        }

        function initController() {
            var signalOpt = {
                moveControl: new signals.Signal(),
                teethNumChanged: new signals.Signal(),
                toothWChanged: new signals.Signal(),
                toothHChanged: new signals.Signal()
            };

            var container = new CMControl.Panel();
            container.setClass('sidebar');

            var titleBar = new CMControl.TitleBar(container, signalOpt);
            titleBar.setClass('title-bar');
            container.add(titleBar);
            var item = new CMControl.Panel();
            item.setTextContent('PREY ON ANIMATION');
            item.setClass('title');
            titleBar.add(item);
            item = new CMControl.Panel();
            item.setTextContent('VERSION 1.0 - JONGMIN KIM');
            item.setClass('title-s');
            titleBar.add(item);

            // teeth num
            var teethCon = new CMControl.Panel();
            container.add(teethCon);
            var teethItem = new CMControl.Panel();
            teethItem.setTextContent('TEETH NUM : 5');
            teethItem.setClass('label');
            teethCon.add(teethItem);
            var slideTeeth = new CMControl.Slide(0.07);
            slideTeeth.onChange(function (value) {
                signalOpt.teethNumChanged.dispatch({num: value});
            });
            teethCon.add(slideTeeth);
            signalOpt.teethNumChanged.add(function(object) {
                var num = CMControl.getCurrent(object.num, 0, 1, 4, 100) | 0;
                if (num % 2 == 0) {
                    _teethTotal = num;
                    teethItem.setTextContent('TEETH NUM : ' + (_teethTotal / 2));
                }
            });

            // tooth width
            var toothWCon = new CMControl.Panel();
            container.add(toothWCon);
            var toothWItem = new CMControl.Panel();
            toothWItem.setTextContent('TOOTH WIDTH : 200');
            toothWItem.setClass('label');
            toothWCon.add(toothWItem);
            var slideToothW = new CMControl.Slide(0.617);
            slideToothW.onChange(function (value) {
                signalOpt.toothWChanged.dispatch({num: value});
            });
            toothWCon.add(slideToothW);
            signalOpt.toothWChanged.add(function(object) {
                _toothW = CMControl.getCurrent(object.num, 0, 1, 40, 300) | 0;
                _toothW2 = _toothW >> 1;
                toothWItem.setTextContent('TOOTH WIDTH : ' + _toothW);
            });

            // tooth height
            var toothHCon = new CMControl.Panel();
            container.add(toothHCon);
            var toothHItem = new CMControl.Panel();
            toothHItem.setTextContent('TOOTH HEIGHT : 160');
            toothHItem.setClass('label');
            toothWCon.add(toothHItem);
            var slideToothH = new CMControl.Slide(0.3);
            slideToothH.onChange(function (value) {
                signalOpt.toothHChanged.dispatch({num: value});
            });
            toothHCon.add(slideToothH);
            signalOpt.toothHChanged.add(function(object) {
                _toothH = CMControl.getCurrent(object.num, 0, 1, 100, 300) | 0;
                toothHItem.setTextContent('TOOTH HEIGHT : ' + _toothH);
            });

            // points
            var checkCon = new CMControl.Panel();
            checkCon.setClass('check');
            container.add(checkCon);
            var checkItem = new CMControl.Panel();
            checkItem.setTextContent('SHOW POINTS');
            checkItem.setClass('label');
            checkCon.add(checkItem);
            var checkBack = new CMControl.Radio(true);
            checkBack.setClass('check-box');
            checkBack.onChange(function() {
                if (!_isPoint) return;
                _isPoint = 0;
                checkFront.setValue(0);
            });
            checkCon.add(checkBack);
            item = new CMControl.Panel();
            item.setTextContent('HIDE');
            item.setClass('check-text');
            checkCon.add(item);

            checkCon = new CMControl.Panel();
            checkCon.setClass('check');
            container.add(checkCon);
            var checkFront = new CMControl.Radio(false);
            checkFront.setClass('check-box');
            checkFront.onChange(function() {
                if (_isPoint) return;
                _isPoint = 1;
                checkBack.setValue(0);
            });
            checkCon.add(checkFront);
            item = new CMControl.Panel();
            item.setTextContent('SHOW');
            item.setClass('check-text');
            checkCon.add(item);

            // animation
            var aniCon = new CMControl.Panel();
            container.add(aniCon);
            var aniItem = new CMControl.Panel();
            aniItem.setTextContent('ANIMATION');
            aniItem.setClass('label');
            aniCon.add(aniItem);

            item = new CMControl.Panel();
            item.setClass('my-bt my-over');
            item.setTextContent('CLOSE');
            item.onClick(function() {
                closeMouth();
            });
            aniCon.add(item);

            item = new CMControl.Panel();
            item.setClass('my-bt my-over');
            item.setTextContent('OPEN');
            item.onClick(function() {
                openMouth();
            });
            aniCon.add(item);

            // label
            var labelCon = new CMControl.Panel();
            container.add(labelCon);
            item = new CMControl.Panel();
            item.setHTMLContent('<a href="http://blog.cmiscm.com/?p=5325" target="_blank">BLOG.CMISCM.COM</a>');
            item.setClass('link');
            labelCon.add(item);

            signalOpt.moveControl.add(function(object) {
                var tx = object.x;
                slideTeeth.setGap(tx);
                slideToothW.setGap(tx);
                slideToothH.setGap(tx);
            });

            document.body.appendChild(container.dom);
        }

        function onResize() {
            var pos = $canvas.getBoundingClientRect();
            _sw = pos.width;
            _sh = pos.height;

            _cx = _sw >> 1;
            _cy = _sh >> 1;

            _close = {y1:_cy, y2:_cy, c1:_cy, c2:_cy};
            _open = {y1:0, y2:_sh, c1:-_cy, c2:_sh + _cy};
            _points = {y1:0, y2:_sh, c1:-_cy, c2:_sh + _cy};

            $canvas.width = _sw;
            $canvas.height = _sh;
            _ctx = $canvas.getContext('2d');
        }

        function closeMouth() {
            TweenLite.to(_guide, 1.2, {
                y:1,
                ease: Expo.easeInOut
            });
        }

        function openMouth() {
            TweenLite.to(_guide, 1.2, {
                y:0,
                ease: Expo.easeInOut
            });
        }

        function animate() {
            _raf = window.requestAnimationFrame(animate);
            _ctx.clearRect(0, 0, _sw, _sh);
            loop();
        }

        function loop() {
            _guide.y += (_moveY * 0.005);
            if (_guide.y < 0) _guide.y = 0;
            else if (_guide.y > 1) _guide.y = 1;

            _points.y1 = getCurrent(_guide.y, _open.y1, _close.y1);
            _points.y2 = getCurrent(_guide.y, _open.y2, _close.y2);
            _points.c1 = getCurrent(_guide.y, _open.c1, _close.c1);
            _points.c2 = getCurrent(_guide.y, _open.c2, _close.c2);

            var i, point;

            if (_isPoint) {
                drawMouthPoint();

                for (i=1; i<_teethTotal; i++) {
                    point = getPointOnQuad({x:0, y:_points.y1}, {x:_cx, y:_points.c1}, {x:_sw, y:_points.y1}, i / _teethTotal);
                    if (i % 2) drawToothPoint(point, 1);
                    point = getPointOnQuad({x:0, y:_points.y2}, {x:_cx, y:_points.c2}, {x:_sw, y:_points.y2}, i / _teethTotal);
                    if (i % 2 == 0) drawToothPoint(point, 0);
                }
            } else {
                for (i=1; i<_teethTotal; i++) {
                    point = getPointOnQuad({x:0, y:_points.y1}, {x:_cx, y:_points.c1}, {x:_sw, y:_points.y1}, i / _teethTotal);
                    if (i % 2) drawTooth(point, 1);
                    point = getPointOnQuad({x:0, y:_points.y2}, {x:_cx, y:_points.c2}, {x:_sw, y:_points.y2}, i / _teethTotal);
                    if (i % 2 == 0) drawTooth(point, 0);
                }

                drawMouth();
            }
        }

        function drawMouth() {
            if (_isPoint) {
                _ctx.fillStyle = 'transparent';
                _ctx.strokeStyle = '#fff';
                _ctx.lineWidth = 2;
            } else {
                _ctx.fillStyle = '#113063';
                _ctx.strokeStyle = '#transparent';
                _ctx.lineWidth = 0;
            }

            _ctx.beginPath();
            _ctx.moveTo(0, 0);
            _ctx.lineTo(_sw, 0);
            _ctx.lineTo(_sw, _points.y1);
            _ctx.quadraticCurveTo(_cx, _points.c1, 0, _points.y1);
            _ctx.lineTo(0, 0);
            _ctx.closePath();
            _ctx.fill();

            _ctx.beginPath();
            _ctx.moveTo(0, _sh);
            _ctx.lineTo(_sw, _sh);
            _ctx.lineTo(_sw, _points.y2);
            _ctx.quadraticCurveTo(_cx, _points.c2, 0, _points.y2);
            _ctx.lineTo(0, _sh);
            _ctx.closePath();
            _ctx.fill();
        }

        function drawTooth(pos, isUp) {
            var tx = pos.x, tx3 = tx + (_toothW2 >> 1),
                ty, toothH;
            if (isUp) {
                ty = pos.y - 80;
                toothH = _toothH;
            } else {
                ty = pos.y + 80;
                toothH = -_toothH;
            }

            _ctx.fillStyle = '#fff';
            _ctx.beginPath();
            _ctx.moveTo(tx, ty);
            _ctx.lineTo(tx + _toothW2, ty);
            _ctx.lineTo(tx, ty + toothH);
            _ctx.lineTo(tx - _toothW2, ty);
            _ctx.lineTo(tx, ty);
            _ctx.closePath();
            _ctx.fill();


            _ctx.fillStyle = '#ccc';
            _ctx.beginPath();
            _ctx.moveTo(tx3, ty);
            _ctx.lineTo(tx + _toothW2, ty);
            _ctx.lineTo(tx, ty + toothH);
            _ctx.lineTo(tx3, ty);
            _ctx.closePath();
            _ctx.fill();
        }

        function drawMouthPoint() {
            _ctx.fillStyle = 'transparent';
            _ctx.strokeStyle = '#fff';
            _ctx.lineWidth = 2;

            _ctx.beginPath();
            _ctx.moveTo(0, 0);
            _ctx.lineTo(_sw, 0);
            _ctx.lineTo(_sw, _points.y1);
            _ctx.quadraticCurveTo(_cx, _points.c1, 0, _points.y1);
            _ctx.lineTo(0, 0);
            _ctx.closePath();
            _ctx.stroke();

            _ctx.beginPath();
            _ctx.moveTo(0, _sh);
            _ctx.lineTo(_sw, _sh);
            _ctx.lineTo(_sw, _points.y2);
            _ctx.quadraticCurveTo(_cx, _points.c2, 0, _points.y2);
            _ctx.lineTo(0, _sh);
            _ctx.closePath();
            _ctx.stroke();
        }

        function drawToothPoint(pos) {
            _ctx.fillStyle = '#ffc107';
            _ctx.beginPath();
            _ctx.arc(pos.x, pos.y, 10, 0, 2 * Math.PI, false);
            _ctx.fill();
        }

        function getCurrent(cur, min, max) {
            return (max - min) * cur + min;
        }

        /*
         Get point on curved line
         @p1: start point
         @p2: control point
         @p3: end point
         @p: p = 0 is the start of the curve, p = 0.5 is middle and p = 1 is end
         */
        function getPointOnQuad(p1, p2, p3, p){
            var x1 = (p2.x - p1.x) * p + p1.x,
                y1 = (p2.y - p1.y) * p + p1.y,
                x2 = (p3.x - p2.x) * p + p2.x,
                y2 = (p3.y - p2.y) * p + p2.y,
                point = {x:(x2 - x1) * p + x1, y:(y2 - y1) * p + y1};
            return point;
        }

        function downFn(mx, my) {
            _isDown = 1;
            _moveX = 0;
            _moveY = 0;
            _offsetX = mx;
            _offsetY = my;
        }
        function moveFn(mx, my) {
            if (!_isDown) return;
            _moveX = mx - _offsetX;
            _moveY = my - _offsetY;
            _offsetX = mx;
            _offsetY = my;
        }
        function upFn() {
            _isDown = 0;
            _moveY = 0;
        }


        function touchStart(e) {
            var touch = e.touches[0];
            downFn(touch.pageX, touch.pageY);
        }
        function touchMove(e) {
            e.preventDefault();
            var touch = e.touches[0];
            moveFn(touch.pageX, touch.pageY);
        }
        function touchEnd(e) {
            upFn();
        }

        function onDown(e) {
            downFn(e.pageX, e.pageY);
        }
        function onMove(e) {
            moveFn(e.pageX, e.pageY);
        }
        function onUp(e) {
            upFn();
        }

        return {
            init: init
        }
    })();
