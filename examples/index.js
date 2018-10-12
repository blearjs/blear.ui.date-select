/**
 * 文件描述
 * @author ydr.me
 * @create 2016-05-30 11:08
 */


'use strict';

var DateSelect = require('../src/index');


var ds = new DateSelect({
    el: '#demo',
    dates: [
        [2019, 0, 1],
        [2019, 0, 2],
        [2019, 0, 21]
    ],
    descriptions: [
        ['¥3300', '11票'],
        ['¥3400', '10票'],
        ['¥3500', '20票'],
        ['¥3600', '25票']
    ]
});
