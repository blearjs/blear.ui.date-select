/**
 * 文件描述
 * @author ydr.me
 * @create 2016-05-30 11:08
 */


'use strict';

var DateSelect = require('../src/index');


var ds = new DateSelect({
    el: '#demo',
    active: 4,
    dates: [
        [2017, 3, 20],
        [2017, 4, 26],
        [2017, 4, 29],
        [2017, 5, 1],
        [2017, 5, 5],
        [2017, 5, 9],
        [2019, 0, 1]
    ],
    descriptions: [
        ['¥2300',1],
        ['¥2300', 1],
        ['¥2300',1],
        ['¥2300', 1],
        ['¥2300',1],
        ['¥2300', 1],
        ['¥2300',1]
    ]
});
