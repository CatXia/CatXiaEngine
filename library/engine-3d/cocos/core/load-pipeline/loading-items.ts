/*
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
  worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
  not use Cocos Creator software for developing other software or tools that's
  used for developing games. You are not granted to publish, distribute,
  sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

/**
 * @category loader
 */

import {CallbacksInvoker} from '../event/callbacks-invoker';
import {extname} from '../utils/path';
import {createMap, mixin} from '../utils/js';
import { legacyCC } from '../global-exports';

let _qid = (0|(Math.random()*998));
let _queues = createMap(true);
let _pool: Array<LoadingItems> = [];
const _POOL_MAX_LENGTH = 10;

export interface IItem {
    queueId;
    id: string;
    url; // real download url, maybe changed
    rawUrl; // url used in scripts
    urlParam;
    type: string;
    error: Error|null;
    content: any;
    complete: boolean;
    states: object;
    deps;
    isScene: boolean;
}

enum ItemState {
    WORKING,
    COMPLETE,
    ERROR
};

let _queueDeps = createMap(true);

function isIdValid (id) {
    let realId = id.url || id;
    return (typeof realId === 'string');
}

function _parseUrlParam (url) {
    if (!url) return undefined;
    let split = url.split('?');
    if (!split || !split[0] || !split[1]) {
        return undefined;
    }
    let urlParam = {};
    let queries = split[1].split('&');
    queries.forEach(function (item) {
        let itemSplit = item.split('=');
        urlParam[itemSplit[0]] = itemSplit[1];
    });
    return urlParam;
}
function createItem (id, queueId) {
    let url = (typeof id === 'object') ? id.url : id;
    let result = {
        queueId: queueId,
        id: url,
        url: url, // real download url, maybe changed
        rawUrl: undefined, // url used in scripts
        urlParam: _parseUrlParam(url),
        type: "",
        error: null,
        content: null,
        complete: false,
        states: {},
        deps: null,
        isScene: id.uuid && legacyCC.game._sceneInfos.find((info) => info.uuid === id.uuid),
    };

    if (typeof id === 'object') {
        mixin(result, id);
        if (id.skips) {
            for (let i = 0; i < id.skips.length; i++) {
                let skip = id.skips[i];
                result.states[skip] = ItemState.COMPLETE;
            }
        }
    }
    result.rawUrl = result.url;
    if (url && !result.type) {
        result.type = extname(url).toLowerCase().substr(1);
    }
    return result;
}

let _checkedIds: Array<string> = [];
function checkCircleReference(owner, item: IItem, recursiveCall?) {
    if (!owner || !item) {
        return false;
    }
    let result = false;
    _checkedIds.push(item.id);
    if (item.deps) {
        let i, deps = item.deps, subDep;
        for (i = 0; i < deps.length; i++) {
            subDep = deps[i];
            if (subDep.id === owner.id) {
                result = true;
                break;
            }
            else if (_checkedIds.indexOf(subDep.id) >= 0) {
                continue;
            }
            else if (subDep.deps && checkCircleReference(owner, subDep, true)) {
                result = true;
                break;
            }
        }
    }
    if (!recursiveCall) {
        _checkedIds.length = 0;
    }
    return result;
}

/**
 * @en
 * LoadingItems is the queue of items which can flow them into the loading pipeline.<br/>
 * Please don't construct it directly, use [[create]] instead, because we use an internal pool to recycle the queues.<br/>
 * It hold a map of items, each entry in the map is a url to object key value pair.<br/>
 * Each item always contains the following property:<br/>
 * - id: The identification of the item, usually it's identical to url<br/>
 * - url: The url <br/>
 * - type: The type, it's the extension name of the url by default, could be specified manually too.<br/>
 * - error: The error happened in pipeline will be stored in this property.<br/>
 * - content: The content processed by the pipeline, the final result will also be stored in this property.<br/>
 * - complete: The flag indicate whether the item is completed by the pipeline.<br/>
 * - states: An object stores the states of each pipe the item go through, the state can be: Pipeline.ItemState.WORKING | Pipeline.ItemState.ERROR | Pipeline.ItemState.COMPLETE<br/>
 * <br/>
 * Item can hold other custom properties.<br/>
 * Each LoadingItems object will be destroyed for recycle after onComplete callback<br/>
 * So please don't hold its reference for later usage, you can copy properties in it though.
 * @zh
 * LoadingItems 是一个加载对象队列，可以用来输送加载对象到加载管线中。<br/>
 * 请不要直接使用 new 构造这个类的对象，你可以使用 [[create]] 来创建一个新的加载队列，这样可以允许我们的内部对象池回收并重利用加载队列。
 * 它有一个 map 属性用来存放加载项，在 map 对象中已 url 为 key 值。<br/>
 * 每个对象都会包含下列属性：<br/>
 * - id：该对象的标识，通常与 url 相同。<br/>
 * - url：路径 <br/>
 * - type: 类型，它这是默认的 URL 的扩展名，可以手动指定赋值。<br/>
 * - error：pipeline 中发生的错误将被保存在这个属性中。<br/>
 * - content: pipeline 中处理的临时结果，最终的结果也将被存储在这个属性中。<br/>
 * - complete：该标志表明该对象是否通过 pipeline 完成。<br/>
 * - states：该对象存储每个管道中对象经历的状态，状态可以是 Pipeline.ItemState.WORKING | Pipeline.ItemState.ERROR | Pipeline.ItemState.COMPLETE<br/>
 * <br/>
 * 对象可容纳其他自定义属性。<br/>
 * 每个 LoadingItems 对象都会在 onComplete 回调之后被销毁，所以请不要持有它的引用并在结束回调之后依赖它的内容执行任何逻辑，有这种需求的话你可以提前复制它的内容。
 */
export class LoadingItems extends CallbacksInvoker {
    /**
     * @en The item states of the LoadingItems, its value could be {{ItemState.WORKING}} | {{ItemState.COMPLETE}} | {{ItemState.ERROR}}
     * @zh LoadingItems 队列中的加载项状态，状态的值可能是 {{ItemState.WORKING}} | {{ItemState.COMPLETE}} | {{ItemState.ERROR}}
     */
    static ItemState = new legacyCC.Enum(ItemState);

    /**
     * @en This is a callback which will be invoked while an item flow out the pipeline.
     * You can pass the callback function in LoadingItems.create or set it later.
     * @zh 这个回调函数将在 item 加载结束后被调用。你可以在构造时传递这个回调函数或者是在构造之后直接设置。
     * @param completedCount The number of the items that are already completed.
     * @param totalCount The total number of the items.
     * @param item The latest item which flow out the pipeline.
     * @example
     * ```
     * import { log } from 'cc';
     * loadingItems.onProgress (completedCount, totalCount, item) {
     *     let progress = (100 * completedCount / totalCount).toFixed(2);
     *     log(progress + '%');
     * }
     * ```
     */
    public onProgress:((completedCount: number, totalCount: number, IItem) => void) | undefined;

    /**
     * @en This is a callback which will be invoked while all items is completed,
     * You can pass the callback function in LoadingItems.create or set it later.
     * @zh 该函数将在加载队列全部完成时被调用。你可以在构造时传递这个回调函数或者是在构造之后直接设置。
     * @param errors All errored urls will be stored in this array, if no error happened, then it will be null
     * @param items All items.
     * @example
     * ```
     * import { log } from 'cc';
     * loadingItems.onComplete (errors, items) {
     *     if (error) {
     *         log('Completed with ' + errors.length + ' errors');
     *     } else {
     *         log('Completed ' + items.totalCount + ' items');
     *     }
     * }
     * ```
     */
    public onComplete:((errors: string[]|null, items: LoadingItems) => void) | undefined;

    /**
     * @en The map of all items.
     * @zh 存储所有加载项的对象。
     */
    public map: Map<string, IItem> = createMap(true);

    /**
     * @en The map of completed items.
     * @zh 存储已经完成的加载项。
     */
    public completed = {};

    /**
     * @en Total count of all items.
     * @zh 所有加载项的总数。
     */
    public totalCount = 0;

    /**
     * @en Total count of completed items.
     * @zh 所有完成加载项的总数。
     */
    public completedCount = 0;

    /**
     * @en Activated or not.
     * @zh 是否启用。
     */
    public active: boolean;

    private _id: number;
    private _pipeline;
    private _errorUrls: Array<string> = [];
    private _appending = false;
    public _ownerQueue: LoadingItems|null = null;

    constructor (pipeline, urlList, onProgress, onComplete) {
        super();

        this._id = ++_qid;
        _queues[this._id] = this;

        this._pipeline = pipeline;

        this.onProgress = onProgress;
        this.onComplete = onComplete;

        if (this._pipeline) {
            this.active = true;
        }
        else {
            this.active = false;
        }

        if (urlList) {
            if (urlList.length > 0) {
                this.append(urlList);
            }
            else {
                this.allComplete();
            }
        }
    }

    /**
     * @en The constructor function of LoadingItems, this will use recycled LoadingItems in the internal pool if possible.
     * You can pass onProgress and onComplete callbacks to visualize the loading process.
     * @zh LoadingItems 的构造函数，这种构造方式会重用内部对象缓冲池中的 LoadingItems 队列，以尽量避免对象创建。
     * 你可以传递 onProgress 和 onComplete 回调函数来获知加载进度信息。
     * @param {Pipeline} pipeline The pipeline to process the queue.
     * @param {Array} urlList The items array.
     * @param {Function} [onProgress] The progression callback, refer to [[onProgress]]
     * @param {Function} [onComplete] The completion callback, refer to [[LoadingItems.onComplete]]
     * @return {LoadingItems} The LoadingItems queue object
     * @example
     * ```
     * import { log, LoadingItems } from 'cc';
     * LoadingItems.create(loader, ['a.png', 'b.plist'], function (completedCount, totalCount, item) {
     *     let progress = (100 * completedCount / totalCount).toFixed(2);
     *     log(progress + '%');
     * }, function (errors, items) {
     *     if (errors) {
     *         for (let i = 0; i < errors.length; ++i) {
     *             log('Error url: ' + errors[i] + ', error: ' + items.getError(errors[i]));
     *         }
     *     }
     *     else {
     *         let result_a = items.getContent('a.png');
     *         // ...
     *     }
     * })
     * ```
     */
    static create (pipeline, urlList, onProgress?, onComplete?) {
        if (onProgress === undefined) {
            if (typeof urlList === 'function') {
                onComplete = urlList;
                urlList = onProgress = null;
            }
        }
        else if (onComplete === undefined) {
            if (typeof urlList === 'function') {
                onComplete = onProgress;
                onProgress = urlList;
                urlList = null;
            }
            else {
                onComplete = onProgress;
                onProgress = null;
            }
        }

        let queue = _pool.pop();
        if (queue) {
            queue._pipeline = pipeline;
            queue.onProgress = onProgress;
            queue.onComplete = onComplete;
            _queues[queue._id] = queue;
            if (queue._pipeline) {
                queue.active = true;
            }
            if (urlList) {
                queue.append(urlList);
            }
        }
        else {
            queue = new LoadingItems(pipeline, urlList, onProgress, onComplete);
        }

        return queue;
    }

    /**
     * @en Retrieve the LoadingItems queue object for an item.
     * @zh 通过 item 对象获取它的 LoadingItems 队列。
     * @param item The item to query
     * @return The LoadingItems queue object
     */
    static getQueue (item: IItem): LoadingItems | null {
        return item.queueId ? _queues[item.queueId] : null;
    }

    /**
     * @en Complete an item in the LoadingItems queue, please do not call this method unless you know what's happening.
     * @zh 通知 LoadingItems 队列一个 item 对象已完成，请不要调用这个函数，除非你知道自己在做什么。
     * @param item The item which has completed
     */
    static itemComplete (item: IItem) {
        let queue = _queues[item.queueId];
        if (queue) {
            // console.log('----- Completed by pipeline ' + item.id + ', rest: ' + (queue.totalCount - queue.completedCount-1));
            queue.itemComplete(item.id);
        }
    }

    static initQueueDeps (queue) {
        let dep = _queueDeps[queue._id];
        if (!dep) {
            dep = _queueDeps[queue._id] = {
                completed: [],
                deps: []
            };
        }
        else {
            dep.completed.length = 0;
            dep.deps.length = 0;
        }
    }

    static registerQueueDep (owner, depId) {
        let queueId = owner.queueId || owner;
        if (!queueId) {
            return false;
        }
        let queueDepList = _queueDeps[queueId];
        // Owner is root queue
        if (queueDepList) {
            if (queueDepList.deps.indexOf(depId) === -1) {
                queueDepList.deps.push(depId);
            }
        }
        // Owner is an item in the intermediate queue
        else if (owner.id) {
            for (let id in _queueDeps) {
                let queue = _queueDeps[id];
                // Found root queue
                if (queue.deps.indexOf(owner.id) !== -1) {
                    if (queue.deps.indexOf(depId) === -1) {
                        queue.deps.push(depId);
                    }
                }
            }
        }
    }

    static finishDep (depId) {
        for (let id in _queueDeps) {
            let queue = _queueDeps[id];
            // Found root queue
            if (queue.deps.indexOf(depId) !== -1 && queue.completed.indexOf(depId) === -1) {
                queue.completed.push(depId);
            }
        }
    }

    /**
     * @en Add urls to the LoadingItems queue.
     * @zh 向一个 LoadingItems 队列添加加载项。
     * @param urlList 要追加的url列表，url可以是对象或字符串
     * @param owner
     * @return 在已接受的url列表中，可以拒绝某些无效项
     */
    append (urlList: object[], owner?): IItem[] {
        if (!this.active) {
            return [];
        }
        if (owner && !owner.deps) {
            owner.deps = [];
        }

        this._appending = true;
        let accepted: Array<IItem> = [], i, url, item;
        for (i = 0; i < urlList.length; ++i) {
            url = urlList[i];

            // Already queued in another items queue, url is actually the item
            if (url.queueId && !this.map[url.id]) {
                this.map[url.id] = url;
                // Register item deps for circle reference check
                owner && owner.deps.push(url);
                // Queued and completed or Owner circle referenced by dependency
                if (url.complete || checkCircleReference(owner, url)) {
                    this.totalCount++;
                    // console.log('----- Completed already or circle referenced ' + url.id + ', rest: ' + (this.totalCount - this.completedCount-1));
                    this.itemComplete(url.id);
                    continue;
                }
                // Not completed yet, should wait it
                else {
                    let self = this;
                    let queue = _queues[url.queueId];
                    if (queue) {
                        this.totalCount++;
                        LoadingItems.registerQueueDep(owner || this._id, url.id);
                        // console.log('+++++ Waited ' + url.id);
                        queue.addListener(url.id, function (item) {
                            // console.log('----- Completed by waiting ' + item.id + ', rest: ' + (self.totalCount - self.completedCount-1));
                            self.itemComplete(item.id);
                        });
                    }
                    continue;
                }
            }
            // Queue new items
            if (isIdValid(url)) {
                item = createItem(url, this._id);
                let key = item.id;
                // No duplicated url
                if (!this.map[key]) {
                    this.map[key] = item;
                    this.totalCount++;
                    // Register item deps for circle reference check
                    owner && owner.deps.push(item);
                    LoadingItems.registerQueueDep(owner || this._id, key);
                    accepted.push(item);
                    // console.log('+++++ Appended ' + item.id);
                }
            }
        }
        this._appending = false;

        // Manually complete
        if (this.completedCount === this.totalCount) {
            // console.log('===== All Completed ');
            this.allComplete();
        }
        else {
            this._pipeline.flowIn(accepted);
        }
        return accepted;
    }

    _childOnProgress (item) {
        if (this.onProgress) {
            let dep = _queueDeps[this._id];
            this.onProgress(dep ? dep.completed.length : this.completedCount, dep ? dep.deps.length : this.totalCount, item);
        }
    }

    /**
     * @en Complete a LoadingItems queue, please do not call this method unless you know what's happening.
     * @zh 完成一个 LoadingItems 队列，请不要调用这个函数，除非你知道自己在做什么。
     */
    allComplete () {
        let errors = this._errorUrls.length === 0 ? null : this._errorUrls;
        if (this.onComplete) {
            this.onComplete(errors, this);
        }
    }

    /**
     * @en Check whether all items are completed.
     * @zh 检查是否所有加载项都已经完成。
     */
    isCompleted (): boolean {
        return this.completedCount >= this.totalCount;
    }

    /**
     * @en Check whether an item is completed.
     * @zh 通过 id 检查指定加载项是否已经加载完成。
     * @param id The item's id.
     */
    isItemCompleted (id: string): boolean {
        return !!this.completed[id];
    }

    /**
     * @en Check whether an item exists.
     * @zh 通过 id 检查加载项是否存在。
     * @param id The item's id.
     */
    exists (id: string): boolean {
        return !!this.map[id];
    }

    /**
     * @en Returns the content of an internal item.
     * @zh 通过 id 获取指定对象的内容。
     * @param id The item's id.
     */
    getContent (id: string): any {
        let item = this.map[id];
        let ret = null;
        if (item) {
            if (item.content) {
                ret = item.content;
            }
            else if (item.alias) {
                ret = item.alias.content;
            }
        }

        return ret;
    }

    /**
     * @en Returns the error of an internal item.
     * @zh 通过 id 获取指定对象的错误信息。
     * @param id The item's id.
     */
    getError (id: string): any {
        let item = this.map[id];
        let ret = null;
        if (item) {
            if (item.error) {
                ret = item.error;
            } else if (item.alias) {
                ret = item.alias.error;
            }
        }

        return ret;
    }

    /**
     * @en Remove an item, can only remove completed item, ongoing item can not be removed.
     * @zh 移除加载项，这里只会移除已经完成的加载项，正在进行的加载项将不能被删除。
     * @param url
     */
    removeItem (url: string) {
        let item = this.map[url];
        if (!item) return;

        if (!this.completed[item.alias || url]) return;

        delete this.completed[url];
        delete this.map[url];
        if (item.alias) {
            delete this.completed[item.alias.id];
            delete this.map[item.alias.id];
        }

        this.completedCount--;
        this.totalCount--;
    }

    /**
     * @en Complete an item in the LoadingItems queue, please do not call this method unless you know what's happening.
     * @zh 通知 LoadingItems 队列一个 item 对象已完成，请不要调用这个函数，除非你知道自己在做什么。
     * @param id The item url
     */
    itemComplete (id: string) {
        let item = this.map[id];
        if (!item) {
            return;
        }

        // Register or unregister errors
        let errorListId = this._errorUrls.indexOf(id);
        if (item.error && errorListId === -1) {
            this._errorUrls.push(id);
        }
        else if (!item.error && errorListId !== -1) {
            this._errorUrls.splice(errorListId, 1);
        }

        this.completed[id] = item;
        this.completedCount++;

        LoadingItems.finishDep(item.id);
        if (this.onProgress) {
            let dep = _queueDeps[this._id];
            this.onProgress(dep ? dep.completed.length : this.completedCount, dep ? dep.deps.length : this.totalCount, item);
        }

        this.emit(id, item);
        this.removeAll(id);

        // All completed
        if (!this._appending && this.completedCount >= this.totalCount) {
            // console.log('===== All Completed ');
            this.allComplete();
        }
    }

    /**
     * @en Destroy the LoadingItems queue, the queue object won't be garbage collected, it will be recycled, so every after destroy is not reliable.
     * @zh 销毁一个 LoadingItems 队列，这个队列对象会被内部缓冲池回收，所以销毁后的所有内部信息都是不可依赖的。
     */
    destroy () {
        this.active = false;
        this._appending = false;
        this._pipeline = null;
        this._ownerQueue = null;
        this._errorUrls.length = 0;
        this.onProgress = undefined;
        this.onComplete = undefined;

        this.map = createMap(true);
        this.completed = {};

        this.totalCount = 0;
        this.completedCount = 0;

        this.clear();

        _queues[this._id] = null;
        if (_queueDeps[this._id]) {
            _queueDeps[this._id].completed.length = 0;
            _queueDeps[this._id].deps.length = 0;
        }
        if (_pool.indexOf(this) === -1 && _pool.length < _POOL_MAX_LENGTH) {
            _pool.push(this);
        }
    }

    /**
     * @en Add a listener for an item, the callback will be invoked when the item is completed.
     * @zh 监听加载项（通过 key 指定）的完成事件。
     * @param key - The item key
     * @param callback - Callback function when item loaded
     * @param target - Callback callee
     */
    addListener (key: string, callback: Function, target?: any) {
        return super.on(key, callback, target);
    }

    /**
     * @en
     * Check if the specified key has any registered callback.
     * If a callback is also specified, it will only return true if the callback is registered.
     * @zh
     * 检查指定的加载项是否有完成事件监听器。
     * 如果同时还指定了一个回调方法，并且回调有注册，它只会返回 true。
     * @param key - The item key
     * @param callback - Callback function when item loaded
     * @param target - Callback callee
     * @return Whether the corresponding listener for the item is registered
     */
    hasListener (key: string, callback?: Function, target?: any): boolean {
        return super.hasEventListener(key, callback, target);
    }

    /**
     * @en
     * Removes a listener.
     * It will only remove when key, callback, target all match correctly.
     * @zh
     * 移除指定加载项已经注册的完成事件监听器。
     * 只会删除 key, callback, target 均匹配的监听器。
     * @param key - The item key
     * @param callback - Callback function when item loaded
     * @param target - Callback callee
     */
    removeListener (key: string, callback?: Function, target?: any) {
        return super.off(key, callback, target);
    }

    /**
     * @en Removes all callbacks registered in a certain event
     * type or all callbacks registered with a certain target.
     * @zh 删除指定目标的所有完成事件监听器。
     * @param {String|Object} key - The item key to be removed or the target to be removed
     */
    removeAllListeners (key) {
        super.removeAll(key);
    }
}

legacyCC.LoadingItems = LoadingItems;
