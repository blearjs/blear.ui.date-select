/**
 * 有限日期选择
 * @author ydr.me
 * @create 2016-05-11 11:24
 */



'use strict';

var UI = require('blear.ui');
var Slider = require('blear.ui.slider');
var object = require('blear.utils.object');
var date = require('blear.utils.date');
var calendar = require('blear.utils.calendar');
var array = require('blear.utils.array');
var string = require('blear.utils.string');
var typeis = require('blear.utils.typeis');
var Template = require('blear.classes.template');
var selector = require('blear.core.selector');
var attribute = require('blear.core.attribute');
var modification = require('blear.core.modification');
var layout = require('blear.core.layout');
var event = require('blear.core.event');

var template = require('./template.html', 'html');

var namespace = UI.UI_CLASS + '-dateSelect';
var gid = 0;
var defaults = {
    /**
     * 父级容器
     * @type String|HTMLElement
     */
    el: '',

    /**
     * 添加的 class
     * @type String
     */
    addClass: '',

    /**
     * 指定有限日期
     * ```
     * [timeStamp, new Date(), [year, month, date]]
     * ```
     * @type Array
     */
    dates: [],

    /**
     * 指定高亮
     * @type Number
     */
    active: -1,

    /**
     * 对应日期的描述
     * ```
     * [String]
     * ```
     * @type Array
     */
    descriptions: [],

    /**
     * 每月显示的周数
     * @type Number
     */
    weeks: 6,

    /**
     * 一周的第一天星期几，默认为周日
     * @type Number
     */
    firstDayInWeek: 0,

    /**
     * 隐藏今天及以前的日期
     * @type Boolean
     */
    hideBefore: true,

    /**
     * 隐藏非本月日期
     * @type Boolean
     */
    hideNotMonth: false,

    /**
     * 滚动动画函数
     * @type Function|undefined
     */
    slideAnimation: undefined
};
var DateSelect = UI.extend({
    className: 'DateSelect',
    constructor: function (options) {
        var the = this;

        DateSelect.parent(the);
        the[_options] = object.assign(true, {}, defaults, options);
        the[_containerEl] = selector.query(options.el)[0];
        the[_initData]();
        the[_initNode]();
        the[_initEvent]();
    },

    /**
     * 销毁实例
     */
    destroy: function () {
        var the = this;

        event.un(the[_bodyEl]);
        event.un(the[_prevEl]);
        event.un(the[_nextEl]);
        the[_slider].destroy();
        DateSelect.parent.destroy(the);
    }
});
var _options = DateSelect.sole();
var _containerEl = DateSelect.sole();
var _initData = DateSelect.sole();
var _initNode = DateSelect.sole();
var _initEvent = DateSelect.sole();
var _headerEl = DateSelect.sole();
var _prevEl = DateSelect.sole();
var _nextEl = DateSelect.sole();
var _bodyEl = DateSelect.sole();
var _yearEl = DateSelect.sole();
var _monthEl = DateSelect.sole();
var _data = DateSelect.sole();
var _slider = DateSelect.sole();
var _jumpView = DateSelect.sole();
var pro = DateSelect.prototype;


/**
 * 初始化数据
 */
pro[_initData] = function () {
    var the = this;
    var options = the[_options];

    the[_data] = {
        id: namespace + (gid++),
        options: the[_options],
        weeks: {
            0: '日',
            1: '一',
            2: '二',
            3: '三',
            4: '四',
            5: '五',
            6: '六'
        },
        calendars: [],
        selectedId: 0,
        visibleYear: 0,
        visibleMonth: 0,
        visibleIndex: 0,
        orderedMonthList: [],
        length: 0
    };

    var orderedDateList = [];
    var candidacyMap = {};
    var now = new Date();
    var nowMonthId = parseInt(date.id(now) / 100);
    var nowTime = now.getTime();
    var nowId = date.id(now);
    var descs = options.descriptions;
    var descLength = descs[0].length;

    options.dates = options.dates || [];

    if (!options.dates.length && typeof DEBUG !== 'undefined' && DEBUG === true) {
        throw new TypeError('请至少指定一个日期');
    }

    array.each(options.dates, function (index, d) {
        var dt = date.parse(d);
        var id = date.id(dt);
        var monthId = parseInt(id / 100);

        if (index === options.active) {
            the[_data].selectedId = id;
        }

        // 隐藏当月以前
        if (options.hideNotMonth && monthId < nowMonthId) {
            return;
        }

        // 隐藏今天以前
        if (options.hideBefore && id <= nowId) {
            return;
        }

        var desc = descs[index];

        if (!typeis.Array(desc)) {
            desc = [desc];
        }

        candidacyMap[id] = {
            desc: desc,
            index: index
        };
        orderedDateList.push(dt);
    });

    orderedDateList.sort(function (a, b) {
        return a.getTime() - b.getTime();
    });

    var monthMap = {};
    var orderedMonthList = [];

    array.each(orderedDateList, function (index, d) {
        var year = d.getFullYear();
        var month = d.getMonth();
        var id = [year, month].join('');

        if (monthMap[id]) {
            return;
        }

        monthMap[id] = true;
        orderedMonthList.push(d);

        var monthCalendar = calendar.month(year, month, {
            weeks: options.weeks,
            firstDayInWeek: options.firstDayInWeek,
            filter: function (d) {
                var candidacy = candidacyMap[d.id];

                if (candidacy) {
                    d.candidacy = true;
                    d.desc = candidacy.desc || new Array(descLength);
                    d.index = candidacy.index;
                } else {
                    d.desc = null;
                    d.index = -1;
                }
            }
        });

        the[_data].calendars.push(monthCalendar);
    });

    // 选取最近的月份
    var foundMonthDate = null;
    var foundIndex = 0;
    var minDelta = 0;

    array.each(orderedMonthList, function (index, omd) {
        var omTime = omd.getTime();
        var delta = Math.abs(omTime - nowTime);

        // 等近，则选取后一个月
        if (delta === minDelta && foundMonthDate && omTime > foundMonthDate.getTime()) {
            minDelta = delta;
            foundMonthDate = omd;
            foundIndex = index;
            return;
        }

        if (!minDelta || delta < minDelta) {
            minDelta = delta;
            foundMonthDate = omd;
            foundIndex = index;
        }
    });

    the[_data].orderedMonthList = orderedMonthList;
    the[_data].length = orderedMonthList.length;
    the[_data].visibleIndex = foundIndex;
    the[_data].visibleYear = foundMonthDate.getFullYear();
    the[_data].visibleMonth = foundMonthDate.getMonth();
    the[_data].descArr = new Array(descLength);
};


/**
 * 初始化 节点
 */
pro[_initNode] = function () {
    var the = this;
    var options = the[_options];
    var tpl = new Template(template, {
        methods: {
            range: array.range
        },
        options: options
    });

    the[_containerEl].innerHTML = tpl.render(the[_data]);
    the[_headerEl] = selector.query('.' + namespace + '-header', the[_containerEl])[0];
    the[_prevEl] = selector.query('.' + namespace + '-nav-prev', the[_containerEl])[0];
    the[_nextEl] = selector.query('.' + namespace + '-nav-next', the[_containerEl])[0];
    the[_bodyEl] = selector.query('.' + namespace + '-body', the[_containerEl])[0];
    the[_yearEl] = selector.query('.' + namespace + '-nav-current-year', the[_containerEl])[0];
    the[_monthEl] = selector.query('.' + namespace + '-nav-current-month', the[_containerEl])[0];
    the[_slider] = new Slider({
        el: the[_bodyEl],
        width: layout.outerWidth(the[_bodyEl]),
        height: layout.outerHeight(the[_bodyEl]) / the[_data].length,
        loop: false,
        auto: false,
        slideAnimation: options.slideAnimation
    });

    var headerHeight = layout.outerHeight(the[_headerEl]);
    attribute.style(the[_bodyEl], 'top', headerHeight);
};


/**
 * 初始化事件
 */
pro[_initEvent] = function () {
    var the = this;
    var classNameSelector = '.' + namespace + '-td_candidacy';
    var selectedClassName = namespace + '-td_selected';
    var els = selector.query(classNameSelector, the[_containerEl]);
    var data = the[_data];
    var prevClass = namespace + '-nav-prev';
    var nextClass = namespace + '-nav-next';
    var prevDisabled = prevClass + '_disabled';
    var nextDisabled = nextClass + '_disabled';

    /**
     * 选中单元格
     * @param el
     */
    var selectTd = function (el) {
        var selectedYear = attribute.data(el, 'year');
        var selectedMonth = attribute.data(el, 'month');
        var selectedDate = attribute.data(el, 'date');
        var selectedIndex = attribute.data(el, 'index');
        var selectedD = new Date(selectedYear, selectedMonth, selectedDate);
        var selectedId = date.id(selectedD);

        if (data.selectedId === selectedId) {
            return;
        }

        data.selectedId = selectedId;
        the.emit('select', selectedIndex * 1, selectedD);

        array.each(els, function (index, el) {
            attribute.removeClass(el, selectedClassName);
        });

        attribute.addClass(el, selectedClassName);
    };

    // 跳转到高亮月份的对应视图
    the[_jumpView](data.orderedMonthList);

    the[_slider].on('afterSlide', function (index) {
        var d = data.orderedMonthList[index];
        var y = d.getFullYear();
        var m = d.getMonth() + 1;

        if (index === 0) {
            attribute.addClass(the[_prevEl], prevDisabled);
        } else {
            attribute.removeClass(the[_prevEl], prevDisabled);
        }

        if (index === data.length - 1) {
            attribute.addClass(the[_nextEl], nextDisabled);
        } else {
            attribute.removeClass(the[_nextEl], nextDisabled);
        }

        the[_yearEl].innerHTML = y + '年';
        the[_monthEl].innerHTML = m + '月';
    });

    the[_slider].tap(classNameSelector, function () {
        selectTd(this);
    });

    the[_slider].tap('.' + prevClass, function () {
        the[_slider].prev();
    });

    the[_slider].tap('.' + nextClass, function () {
        the[_slider].next();
    });

    event.on(the[_prevEl], 'click', function () {
        the[_slider].prev();
    });

    event.on(the[_nextEl], 'click', function () {
        the[_slider].next();
    });

    event.on(the[_bodyEl], 'click', classNameSelector, function () {
        selectTd(this);
    });
};

/**
 * 跳转到对应视图
 * @param orderedMonthList
 */
pro[_jumpView] = function (orderedMonthList) {
    var the = this;
    var options = the[_options];
    var dt = date.parse(options.dates[options.active]);

    array.each(orderedMonthList, function (index, el) {
        if (el.getFullYear() === dt.getFullYear() && el.getMonth() === dt.getMonth()) {
            the[_slider].go(index);
        }
    });
};

require('./style.css', 'css|style');
DateSelect.defaults = defaults;
module.exports = DateSelect;
