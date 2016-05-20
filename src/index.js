/**
 * 有限日期选择
 * @author ydr.me
 * @create 2016-05-11 11:24
 */



'use strict';

var UI =           require('blear.ui');
var object =       require('blear.utils.object');
var date =         require('blear.utils.date');
var calendar =     require('blear.utils.calendar');
var array =        require('blear.utils.array');
var string =       require('blear.utils.string');
var Template =     require('blear.classes.template');
var selector =     require('blear.core.selector');
var attribute =    require('blear.core.attribute');
var modification = require('blear.core.modification');
var layout =       require('blear.core.layout');
var event =        require('blear.core.event');
var template =     require('./template.html', 'html');

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
     * 一周的第一天星期几，默认为周日
     * @type Number
     */
    firstDayInWeek: 0,

    /**
     * 隐藏今天以前的日期
     * @type Boolean
     */
    hideBefore: true,

    /**
     * 滑动动画
     * @param el
     * @param to
     * @param done
     */
    slideAnimation: function (el, to, done) {
        attribute.style(el, to);
        done();
    }
};
var DateSelect = UI.extend({
    className: 'DateSelect',
    constructor: function (options) {
        var the = this;

        the.Super();
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
        the.Super.destroy();
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
        orderedMonthList: null
    };

    var orderedDateList = [];
    var candidacyIdMap = {};
    var now = new Date();
    var nowMonthId = parseInt(date.id(now) / 100);
    var nowTime = now.getTime();

    array.each(options.dates, function (index, d) {
        var dt = date.parse(d);
        var id = date.id(dt);
        var monthId = parseInt(id / 100);

        // 隐藏当月以前
        if (options.hideBefore && monthId < nowMonthId) {
            return;
        }

        candidacyIdMap[id] = true;
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
            firstDayInWeek: options.firstDayInWeek,
            filter: function (_d) {
                if (candidacyIdMap[_d.id]) {
                    _d.candidacy = true;
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
    the[_data].visibleIndex = foundIndex;
    the[_data].visibleYear = foundMonthDate.getFullYear();
    the[_data].visibleMonth = foundMonthDate.getMonth();
};


/**
 * 初始化 节点
 */
pro[_initNode] = function () {
    var the = this;
    var options = the[_options];
    var tpl = new Template(template, {
        methods: {
            range: array.range,
            padStart: string.padStart
        }
    });

    the[_containerEl].innerHTML = tpl.render(the[_data]);
    the[_headerEl] = selector.query('.' + namespace + '-header', the[_containerEl])[0];
    the[_prevEl] = selector.query('.' + namespace + '-header-prev', the[_containerEl])[0];
    the[_nextEl] = selector.query('.' + namespace + '-header-next', the[_containerEl])[0];
    the[_bodyEl] = selector.query('.' + namespace + '-body', the[_containerEl])[0];
    the[_yearEl] = selector.query('.' + namespace + '-header-current-year', the[_containerEl])[0];
    the[_monthEl] = selector.query('.' + namespace + '-header-current-month', the[_containerEl])[0];

    var headerHeight = layout.outerHeight(the[_headerEl]);
    attribute.style(the[_bodyEl], 'top', headerHeight);
};


/**
 * 初始化事件
 */
pro[_initEvent] = function () {
    var the = this;
    var className = '.' + namespace + '-td_candidacy';
    var selectedClassName = namespace + '-td_selected';
    var els = selector.query(className, the[_containerEl]);
    var data = the[_data];

    /**
     * 选中单元格
     * @param el
     */
    var selectTd = function (el) {
        var selectedYear = attribute.data(el, 'year');
        var selectedMonth = attribute.data(el, 'month');
        var selectedDate = attribute.data(el, 'date');
        var selectedD = new Date(selectedYear, selectedMonth, selectedDate);
        var selectedId = date.id(selectedD);

        if (data.selectedId === selectedId) {
            return;
        }

        data.selectedId = selectedId;
        the.emit('select', selectedD);

        array.each(els, function (index, el) {
            attribute.removeClass(el, selectedClassName);
        });

        attribute.addClass(el, selectedClassName);
    };

    event.on(the[_bodyEl], 'click', className, function () {
        selectTd(this);
    });
};


require('./style.css', 'css|style');
DateSelect.defaults = defaults;
module.exports = DateSelect;
