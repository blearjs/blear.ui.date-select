/**
 * 文件描述
 * @author ydr.me
 * @create 2016-05-30 11:08
 */


'use strict';

var DateSelect = require('../src/index');


var ds = new DateSelect({
    el: '#demo',
    active: 6,
    dates: [
        [2016, 3, 20],
        [2016, 4, 30],
        [2016, 4, 31],
        [2016, 5, 1],
        [2016, 5, 5],
        [2016, 5, 9],
        [2019, 0, 1]
    ],
    descriptions: [
        ['¥2300'],
        ['¥2300'],
        ['¥2300'],
        ['¥2300'],
        ['¥2300'],
        ['¥2300'],
        '123'
    ]
});
