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
 * 用户界面组件
 * @category ui
 */

import { ccclass, help, executionOrder, menu, requireComponent, tooltip, displayOrder, type, rangeMin, rangeMax, serializable } from 'cc.decorator';
import { SpriteFrame } from '../../core/assets';
import { Component, EventHandler as ComponentEventHandler } from '../../core/components';
import { UITransform, UIRenderable } from '../../core/components/ui-base';
import { EventMouse, EventTouch, SystemEventType } from '../../core/platform';
import { Color, Vec3 } from '../../core/math';
import { ccenum } from '../../core/value-types/enum';
import { lerp } from '../../core/math/utils';
import { Node } from '../../core/scene-graph/node';
import { Sprite } from './sprite';
import { EDITOR } from 'internal:constants';
import { legacyCC } from '../../core/global-exports';
import { TransformBit } from '../../core/scene-graph/node-enum';

const _tempColor = new Color();

/**
 * @en Enum for transition type.
 *
 * @zh 过渡类型。
 */
enum Transition {
    /**
     * @en The none type.
     *
     * @zh 不做任何过渡。
     */
    NONE = 0,

    /**
     * @en The color type.
     *
     * @zh 颜色过渡。
     */
    COLOR = 1,

    /**
     * @en The sprite type.
     *
     * @zh 精灵过渡。
     */
    SPRITE = 2,
    /**
     * @en The scale type.
     *
     * @zh 缩放过渡。
     */
    SCALE = 3,
}

ccenum(Transition);

enum State {
    NORMAL = 'normal',
    HOVER = 'hover',
    PRESSED = 'pressed',
    DISABLED = 'disabled',
}

export enum EventType {
    CLICK = 'click',
}

/**
 * @en
 * Button has 4 Transition types<br/>
 * When Button state changed:<br/>
 *  If Transition type is Button.Transition.NONE, Button will do nothing<br/>
 *  If Transition type is Button.Transition.COLOR, Button will change target's color<br/>
 *  If Transition type is Button.Transition.SPRITE, Button will change target Sprite's sprite<br/>
 *  If Transition type is Button.Transition.SCALE, Button will change target node's scale<br/>
 *
 * Button will trigger 5 events:<br/>
 *  Button.EVENT_TOUCH_DOWN<br/>
 *  Button.EVENT_TOUCH_UP<br/>
 *  Button.EVENT_HOVER_IN<br/>
 *  Button.EVENT_HOVER_MOVE<br/>
 *  Button.EVENT_HOVER_OUT<br/>
 *  User can get the current clicked node with 'event.target' from event object which is passed as parameter in the callback function of click event.
 *
 * @zh
 * 按钮组件。可以被按下，或者点击。
 *
 * 按钮可以通过修改 Transition 来设置按钮状态过渡的方式：
 *
 *   - Button.Transition.NONE   // 不做任何过渡
 *   - Button.Transition.COLOR  // 进行颜色之间过渡
 *   - Button.Transition.SPRITE // 进行精灵之间过渡
 *   - Button.Transition.SCALE // 进行缩放过渡
 *
 * 按钮可以绑定事件（但是必须要在按钮的 Node 上才能绑定事件）：<br/>
 * 以下事件可以在全平台上都触发：
 *
 *   - cc.Node.EventType.TOUCH_START  // 按下时事件
 *   - cc.Node.EventType.TOUCH_Move   // 按住移动后事件
 *   - cc.Node.EventType.TOUCH_END    // 按下后松开后事件
 *   - cc.Node.EventType.TOUCH_CANCEL // 按下取消事件
 *
 * 以下事件只在 PC 平台上触发：
 *
 *   - cc.Node.EventType.MOUSE_DOWN  // 鼠标按下时事件
 *   - cc.Node.EventType.MOUSE_MOVE  // 鼠标按住移动后事件
 *   - cc.Node.EventType.MOUSE_ENTER // 鼠标进入目标事件
 *   - cc.Node.EventType.MOUSE_LEAVE // 鼠标离开目标事件
 *   - cc.Node.EventType.MOUSE_UP    // 鼠标松开事件
 *   - cc.Node.EventType.MOUSE_WHEEL // 鼠标滚轮事件
 *
 * 用户可以通过获取 __点击事件__ 回调函数的参数 event 的 target 属性获取当前点击对象。
 *
 * @example
 * ```ts
 * import { log, Node } from 'cc';
 * // Add an event to the button.
 * button.node.on(Node.EventType.TOUCH_START, (event) => {
 *     log("This is a callback after the trigger event");
 * });
 * // You could also add a click event
 * //Note: In this way, you can't get the touch event info, so use it wisely.
 * button.node.on('click', (button) => {
 *    //The event is a custom event, you could get the Button component via first argument
 * })
 * ```
 */
@ccclass('cc.Button')
@help('i18n:cc.Button')
@executionOrder(110)
@menu('UI/Button')
@requireComponent(UITransform)
export class Button extends Component {

    /**
     * @en
     * Transition target.
     * When Button state changed:
     * - If Transition type is Button.Transition.NONE, Button will do nothing.
     * - If Transition type is Button.Transition.COLOR, Button will change target's color.
     * - If Transition type is Button.Transition.SPRITE, Button will change target Sprite's sprite.
     *
     * @zh
     * 需要过渡的目标。<br/>
     * 当前按钮状态改变规则：<br/>
     * - 如果 Transition type 选择 Button.Transition.NONE，按钮不做任何过渡。
     * - 如果 Transition type 选择 Button.Transition.COLOR，按钮会对目标颜色进行颜色之间的过渡。
     * - 如果 Transition type 选择 Button.Transition.Sprite，按钮会对目标 Sprite 进行 Sprite 之间的过渡。
     */
    @type(Node)
    @displayOrder(0)
    @tooltip('指定 Button 背景节点，Button 状态改变时会修改此节点的 Color 或 Sprite 属性')
    get target () {
        return this._target || this.node;
    }

    set target (value) {
        if (this._target === value) {
            return;
        }
        if (this._target) {
            // need to remove the old target event listeners
            this._unregisterTargetEvent(this._target);
        }
        this._target = value;
        this._applyTarget();
    }

    /**
     * @en
     * Whether the Button is disabled.
     * If true, the Button will trigger event and do transition.
     *
     * @zh
     * 按钮事件是否被响应，如果为 false，则按钮将被禁用。
     */
    @displayOrder(1)
    @tooltip('按钮是否可交互，这一项未选中时，按钮处在禁用状态')
    get interactable () {
        return this._interactable;
    }

    set interactable (value) {
        // if (EDITOR) {
        //     if (value) {
        //         this._previousNormalSprite = this.normalSprite;
        //     } else {
        //         this.normalSprite = this._previousNormalSprite;
        //     }
        // }
        this._interactable = value;
        this._updateState();

        if (!this._interactable) {
            this._resetState();
        }
    }

    set _resizeToTarget (value: boolean) {
        if (value) {
            this._resizeNodeToTargetNode();
        }
    }

    /**
     * @en
     * Transition type.
     *
     * @zh
     * 按钮状态改变时过渡方式。
     */
    @type(Transition)
    @displayOrder(2)
    @tooltip('按钮状态变化时的过渡类型')
    get transition () {
        return this._transition;
    }

    set transition (value: Transition) {
        if (this._transition === value) {
            return;
        }
        
        // Reset to normal data when change transition.
        if (this._transition === Transition.COLOR) {
            this._updateColorTransition(State.NORMAL);
        }
        else if (this._transition === Transition.SPRITE) {
            this._updateSpriteTransition(State.NORMAL);
        }
        this._transition = value;
        this._updateState();
    }

    // color transition

    /**
     * @en
     * Normal state color.
     *
     * @zh
     * 普通状态下按钮所显示的颜色。
     */
    @tooltip('普通状态的按钮背景颜色')
    // @constget
    get normalColor (): Readonly<Color> {
        return this._normalColor;
    }

    set normalColor (value) {
        if (this._normalColor === value) {
            return;
        }

        this._normalColor.set(value);
        this._updateState();
    }

    /**
     * @en
     * Pressed state color.
     *
     * @zh
     * 按下状态时按钮所显示的颜色。
     */
    @tooltip('按下状态的按钮背景颜色')
    // @constget
    get pressedColor (): Readonly<Color> {
        return this._pressedColor;
    }

    set pressedColor (value) {
        if (this._pressedColor === value) {
            return;
        }

        this._pressedColor.set(value);
    }

    /**
     * @en
     * Hover state color.
     *
     * @zh
     * 悬停状态下按钮所显示的颜色。
     */
    @tooltip('悬停状态的按钮背景颜色')
    // @constget
    get hoverColor (): Readonly<Color> {
        return this._hoverColor;
    }

    set hoverColor (value) {
        if (this._hoverColor === value) {
            return;
        }

        this._hoverColor.set(value);
    }
    /**
     * @en
     * Disabled state color.
     *
     * @zh
     * 禁用状态下按钮所显示的颜色。
     */
    @tooltip('禁用状态的按钮背景颜色')
    // @constget
    get disabledColor (): Readonly<Color> {
        return this._disabledColor;
    }

    set disabledColor (value) {
        if (this._disabledColor === value) {
            return;
        }

        this._disabledColor.set(value);
        this._updateState();
    }

    /**
     * @en
     * Color and Scale transition duration.
     *
     * @zh
     * 颜色过渡和缩放过渡时所需时间。
     */
    @rangeMin(0)
    @rangeMax(10)
    @tooltip('按钮颜色变化或者缩放变化的过渡时间')
    get duration () {
        return this._duration;
    }

    set duration (value) {
        if (this._duration === value) {
            return;
        }

        this._duration = value;
    }

    /**
     * @en
     * When user press the button, the button will zoom to a scale.
     * The final scale of the button equals (button original scale * zoomScale)
     * NOTE: Setting zoomScale less than 1 is not adviced, which could fire the touchCancel event if the touch point is out of touch area after scaling. 
     * if you need to do so, you should set target as another background node instead of the button node.
     *
     * @zh
     * 当用户点击按钮后，按钮会缩放到一个值，这个值等于 Button 原始 scale * zoomScale。
     * 注意：不建议 zoomScale 的值小于 1, 否则缩放后如果触摸点在触摸区域外, 则会触发 touchCancel 事件。
     * 如果你需要这么做，你应该把 target 设置为另一个背景节点，而不是按钮节点。
     */
    @tooltip('当用户点击按钮后，按钮会缩放到一个值，这个值等于 Button 原始 scale * zoomScale。')
    get zoomScale () {
        return this._zoomScale;
    }

    set zoomScale (value) {
        if (this._zoomScale === value) {
            return;
        }

        this._zoomScale = value;
    }

    // sprite transition
    /**
     * @en
     * Normal state sprite.
     *
     * @zh
     * 普通状态下按钮所显示的 Sprite。
     */
    @type(SpriteFrame)
    @tooltip('普通状态的按钮背景图资源')
    get normalSprite () {
        return this._normalSprite;
    }

    set normalSprite (value: SpriteFrame | null) {
        if (this._normalSprite === value) {
            return;
        }

        this._normalSprite = value;
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.spriteFrame = value;
        }

        this._updateState();
    }

    /**
     * @en
     * Pressed state sprite.
     *
     * @zh
     * 按下状态时按钮所显示的 Sprite。
     */
    @type(SpriteFrame)
    @tooltip('按下状态的按钮背景图资源')
    get pressedSprite () {
        return this._pressedSprite;
    }

    set pressedSprite (value: SpriteFrame | null) {
        if (this._pressedSprite === value) {
            return;
        }

        this._pressedSprite = value;
        this._updateState();
    }

    /**
     * @en
     * Hover state sprite.
     *
     * @zh
     * 悬停状态下按钮所显示的 Sprite。
     */
    @type(SpriteFrame)
    @tooltip('悬停状态的按钮背景图资源')
    get hoverSprite () {
        return this._hoverSprite;
    }

    set hoverSprite (value: SpriteFrame | null) {
        if (this._hoverSprite === value) {
            return;
        }

        this._hoverSprite = value;
        this._updateState();
    }

    /**
     * @en
     * Disabled state sprite.
     *
     * @zh
     * 禁用状态下按钮所显示的 Sprite。
     */
    @type(SpriteFrame)
    @tooltip('禁用状态的按钮背景图资源')
    get disabledSprite () {
        return this._disabledSprite;
    }

    set disabledSprite (value: SpriteFrame | null) {
        if (this._disabledSprite === value) {
            return;
        }

        this._disabledSprite = value;
        this._updateState();
    }

    public static Transition = Transition;
    public static EventType = EventType;
    /**
     * @en
     * If Button is clicked, it will trigger event's handler.
     *
     * @zh
     * 按钮的点击事件列表。
     */
    @type([ComponentEventHandler])
    @serializable
    @displayOrder(20)
    @tooltip('按钮点击事件的列表。先将数量改为1或更多，就可以为每个点击事件设置接受者和处理方法')
    public clickEvents: ComponentEventHandler[] = [];
    @serializable
    protected _interactable = true;
    @serializable
    protected _transition = Transition.NONE;
    @serializable
    protected _normalColor: Color = new Color(214, 214, 214, 255);
    @serializable
    protected _hoverColor: Color = new Color(211, 211, 211, 255);
    @serializable
    protected _pressedColor: Color = Color.WHITE.clone();
    @serializable
    protected _disabledColor: Color = new Color(124, 124, 124, 255);
    @serializable
    protected _normalSprite: SpriteFrame | null = null;
    @serializable
    protected _hoverSprite: SpriteFrame | null = null;
    @serializable
    protected _pressedSprite: SpriteFrame | null = null;
    @serializable
    protected _disabledSprite: SpriteFrame | null = null;
    @serializable
    protected _duration = 0.1;
    @serializable
    protected _zoomScale = 1.2;
    @serializable
    protected _target: Node | null = null;
    private _pressed = false;
    private _hovered = false;
    private _fromColor: Color = new Color();
    private _toColor: Color = new Color();
    private _time = 0;
    private _transitionFinished = true;
    private _fromScale: Vec3 = new Vec3();
    private _toScale: Vec3 = new Vec3();
    private _originalScale: Vec3 | null = null;
    private _sprite: Sprite | null = null;
    private _targetScale: Vec3 = new Vec3();

    public __preload () {
        if (!this.target) {
            this.target = this.node;
        }

        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            this._normalSprite = sprite.spriteFrame;
        }

        this._applyTarget();
        this._resetState();
    }

    public onEnable () {
        // check sprite frames
        //
        if (!EDITOR || legacyCC.GAME_VIEW) {
            this.node.on(SystemEventType.TOUCH_START, this._onTouchBegan, this);
            this.node.on(SystemEventType.TOUCH_MOVE, this._onTouchMove, this);
            this.node.on(SystemEventType.TOUCH_END, this._onTouchEnded, this);
            this.node.on(SystemEventType.TOUCH_CANCEL, this._onTouchCancel, this);

            this.node.on(SystemEventType.MOUSE_ENTER, this._onMouseMoveIn, this);
            this.node.on(SystemEventType.MOUSE_LEAVE, this._onMouseMoveOut, this);
        } else {
            this.node.on(Sprite.EventType.SPRITE_FRAME_CHANGED, (comp: Sprite) => {
                if (this._transition === Transition.SPRITE) {
                    this._normalSprite = comp.spriteFrame;
                } else {
                    // avoid serialization data loss when in no-sprite mode
                    this._normalSprite = null;
                    this._hoverSprite = null;
                    this._pressedSprite = null;
                    this._disabledSprite = null;
                }
            }, this);
        }
    }

    public onDisable () {
        this._resetState();

        if (!EDITOR || legacyCC.GAME_VIEW) {
            this.node.off(SystemEventType.TOUCH_START, this._onTouchBegan, this);
            this.node.off(SystemEventType.TOUCH_MOVE, this._onTouchMove, this);
            this.node.off(SystemEventType.TOUCH_END, this._onTouchEnded, this);
            this.node.off(SystemEventType.TOUCH_CANCEL, this._onTouchCancel, this);

            this.node.off(SystemEventType.MOUSE_ENTER, this._onMouseMoveIn, this);
            this.node.off(SystemEventType.MOUSE_LEAVE, this._onMouseMoveOut, this);
        } else {
            this.node.off(Sprite.EventType.SPRITE_FRAME_CHANGED);
        }
    }

    public update (dt: number) {
        const target = this.target;
        if (this._transitionFinished || !target) {
            return;
        }

        if (this._transition !== Transition.COLOR && this._transition !== Transition.SCALE) {
            return;
        }

        this._time += dt;
        let ratio = 1.0;
        if (this._duration > 0) {
            ratio = this._time / this._duration;
        }

        if (ratio >= 1) {
            ratio = 1;
        }

        const renderComp = target.getComponent(UIRenderable);
        if (!renderComp) {
            return;
        }

        if (this._transition === Transition.COLOR) {
            Color.lerp(_tempColor, this._fromColor, this._toColor, ratio);
            renderComp.color = _tempColor;
        } else if (this.transition === Transition.SCALE) {
            target.getScale(this._targetScale);
            this._targetScale.x = lerp(this._fromScale.x, this._toScale.x, ratio);
            this._targetScale.y = lerp(this._fromScale.y, this._toScale.y, ratio);
            target.setScale(this._targetScale);
        }
        
        if (ratio === 1) {
            this._transitionFinished = true;
        }
    }

    protected _resizeNodeToTargetNode () {
        if (!this.target) {
            return;
        }
        let targetTrans = this.target._uiProps.uiTransformComp;
        if (EDITOR && targetTrans) {
            this.node._uiProps.uiTransformComp!.setContentSize(targetTrans.contentSize);
        }
    }

    protected _resetState () {
        this._pressed = false;
        this._hovered = false;
        // Restore button status
        const target = this.target;
        if (!target) {
            return;
        }
        const renderComp = target.getComponent(UIRenderable);
        if (!renderComp) {
            return;
        }

        const transition = this._transition;
        if (transition === Transition.COLOR && this._interactable) {
            renderComp.color = this._normalColor;
        } else if (transition === Transition.SCALE && this._originalScale) {
            target.setScale(this._originalScale);
        }
        this._transitionFinished = true;
    }

    protected _registerNodeEvent () {
        if (!EDITOR || legacyCC.GAME_VIEW) {
            this.node.on(SystemEventType.TOUCH_START, this._onTouchBegan, this);
            this.node.on(SystemEventType.TOUCH_MOVE, this._onTouchMove, this);
            this.node.on(SystemEventType.TOUCH_END, this._onTouchEnded, this);
            this.node.on(SystemEventType.TOUCH_CANCEL, this._onTouchCancel, this);

            this.node.on(SystemEventType.MOUSE_ENTER, this._onMouseMoveIn, this);
            this.node.on(SystemEventType.MOUSE_LEAVE, this._onMouseMoveOut, this);
        }
    }

    protected _registerTargetEvent (target) {
        if (EDITOR && !legacyCC.GAME_VIEW) {
            target.on(Sprite.EventType.SPRITE_FRAME_CHANGED, this._onTargetSpriteFrameChanged, this);
            target.on(SystemEventType.COLOR_CHANGED, this._onTargetColorChanged, this);
        }
        target.on(SystemEventType.TRANSFORM_CHANGED, this._onTargetTransformChanged, this);
    }

    protected _unregisterNodeEvent () {
        if (!EDITOR || legacyCC.GAME_VIEW) {
            this.node.off(SystemEventType.TOUCH_START, this._onTouchBegan, this);
            this.node.off(SystemEventType.TOUCH_MOVE, this._onTouchMove, this);
            this.node.off(SystemEventType.TOUCH_END, this._onTouchEnded, this);
            this.node.off(SystemEventType.TOUCH_CANCEL, this._onTouchCancel, this);

            this.node.off(SystemEventType.MOUSE_ENTER, this._onMouseMoveIn, this);
            this.node.off(SystemEventType.MOUSE_LEAVE, this._onMouseMoveOut, this);
        }
    }

    protected _unregisterTargetEvent (target) {
        if (EDITOR && !legacyCC.GAME_VIEW) {
            target.off(Sprite.EventType.SPRITE_FRAME_CHANGED);
            target.off(SystemEventType.COLOR_CHANGED);
        }
        target.off(SystemEventType.TRANSFORM_CHANGED);
    }

    protected _getTargetSprite (target: Node | null) {
        let sprite: Sprite | null = null;
        if (target) {
            sprite = target.getComponent(Sprite);
        }
        return sprite;
    }

    protected _applyTarget () {
        if (this.target) {
            this._sprite = this._getTargetSprite(this.target);
            if (!this._originalScale) {
                this._originalScale = new Vec3();
            }
            Vec3.copy(this._originalScale, this.target.getScale());
        }
    }

    private _onTargetSpriteFrameChanged (comp: Sprite) {
        if (this._transition === Transition.SPRITE) {
            this._setCurrentStateSpriteFrame(comp.spriteFrame);
        }
    }

    private _setCurrentStateSpriteFrame (spriteFrame: SpriteFrame | null) {
        if (!spriteFrame) {
            return;
        }
        switch (this._getButtonState()) {
            case State.NORMAL:
                this._normalSprite = spriteFrame;
                break;
            case State.HOVER:
                this._hoverSprite = spriteFrame;
                break;
            case State.PRESSED:
                this._pressedSprite = spriteFrame;
                break;
            case State.DISABLED:
                this._disabledSprite = spriteFrame;
                break;
        }
    }

    private _onTargetColorChanged (color: Color) {
        if (this._transition === Transition.COLOR) {
            this._setCurrentStateColor(color);
        }
    }

    private _setCurrentStateColor(color: Color) {
        switch (this._getButtonState()) {
            case State.NORMAL:
                this._normalColor = color;
                break;
            case State.HOVER:
                this._hoverColor = color;
                break;
            case State.PRESSED:
                this._pressedColor = color;
                break;
            case State.DISABLED:
                this._disabledColor = color;
                break;
        }
    }

    private _onTargetTransformChanged (transformBit: TransformBit) {
        // update originalScale
        if (transformBit | TransformBit.SCALE && this._originalScale
            && this._transition === Transition.SCALE && this._transitionFinished) {
            Vec3.copy(this._originalScale, this.target.getScale());
        }
    }

    // touch event handler
    protected _onTouchBegan (event?: EventTouch) {
        if (!this._interactable || !this.enabledInHierarchy) { return; }

        this._pressed = true;
        this._updateState();
        if (event) {
            event.propagationStopped = true;
        }
    }

    protected _onTouchMove (event?: EventTouch) {
        if (!this._interactable || !this.enabledInHierarchy || !this._pressed) { return; }
        // mobile phone will not emit _onMouseMoveOut,
        // so we have to do hit test when touch moving
        if (!event) {
            return false;
        }

        const touch = (event as EventTouch).touch;
        if (!touch) {
            return false;
        }

        const hit = this.node._uiProps.uiTransformComp!.isHit(touch.getUILocation());

        if (this._transition === Transition.SCALE && this.target && this._originalScale) {
            if (hit) {
                Vec3.copy(this._fromScale, this._originalScale);
                Vec3.multiplyScalar(this._toScale, this._originalScale, this._zoomScale);
                this._transitionFinished = false;
            } else {
                this._time = 0;
                this._transitionFinished = true;
                this.target.setScale(this._originalScale);
            }
        } else {
            let state;
            if (hit) {
                state = State.PRESSED;
            } else {
                state = State.NORMAL;
            }
            this._applyTransition(state);
        }

        if (event) {
            event.propagationStopped = true;
        }
    }

    protected _onTouchEnded (event?: EventTouch) {
        if (!this._interactable || !this.enabledInHierarchy) {
            return;
        }

        if (this._pressed) {
            ComponentEventHandler.emitEvents(this.clickEvents, event);
            this.node.emit(EventType.CLICK, this);
        }
        this._pressed = false;
        this._updateState();

        if (event) {
            event.propagationStopped = true;
        }
    }

    protected _onTouchCancel (event?: EventTouch) {
        if (!this._interactable || !this.enabledInHierarchy) { return; }

        this._pressed = false;
        this._updateState();
    }

    protected _onMouseMoveIn (event?: EventMouse) {
        if (this._pressed || !this.interactable || !this.enabledInHierarchy) { return; }
        if (this._transition === Transition.SPRITE && !this._hoverSprite) { return; }

        if (!this._hovered) {
            this._hovered = true;
            this._updateState();
        }
    }

    protected _onMouseMoveOut (event?: EventMouse) {
        if (this._hovered) {
            this._hovered = false;
            this._updateState();
        }
    }

    // state handler
    protected _updateState () {
        const state = this._getButtonState();
        this._applyTransition(state);
    }

    protected _getButtonState () {
        let state = State.NORMAL;
        if (!this._interactable) {
            state = State.DISABLED;
        } else if (this._pressed) {
            state = State.PRESSED;
        } else if (this._hovered) {
            state = State.HOVER;
        }
        return state.toString();
    }

    protected _updateColorTransition (state: string) {
        const color = this[state + 'Color'];

        const renderComp = this.target?.getComponent(UIRenderable);
        if (!renderComp) {
            return;
        }

        if (EDITOR || state === State.DISABLED) {
            renderComp.color = color;
        } else {
            this._fromColor = renderComp.color.clone();
            this._toColor = color;
            this._time = 0;
            this._transitionFinished = false;
        }
    }

    protected _updateSpriteTransition (state: string) {
        const sprite = this[state + 'Sprite'];
        if (this._sprite && sprite) {
            this._sprite.spriteFrame = sprite;
        }
    }

    protected _updateScaleTransition (state: string) {
        if (!this._interactable) {
            return;
        }

        if (state === State.PRESSED) {
            this._zoomUp();
        } else {
            this._zoomBack();
        }
    }

    protected _zoomUp () {
        // skip before __preload()
        if (!this._originalScale) {
            return;
        }
        Vec3.copy(this._fromScale, this._originalScale);
        Vec3.multiplyScalar(this._toScale, this._originalScale, this._zoomScale);
        this._time = 0;
        this._transitionFinished = false;
    }

    protected _zoomBack () {
        if (!this.target || !this._originalScale) {
            return;
        }
        Vec3.copy(this._fromScale, this.target.getScale());
        Vec3.copy(this._toScale, this._originalScale);
        this._time = 0;
        this._transitionFinished = false;
    }

    protected _applyTransition (state: string) {
        const transition = this._transition;
        if (transition === Transition.COLOR) {
            this._updateColorTransition(state);
        } else if (transition === Transition.SPRITE) {
            this._updateSpriteTransition(state);
        } else if (transition === Transition.SCALE) {
            this._updateScaleTransition(state);
        }
    }

}

/**
 * @zh
 * 注意：此事件是从该组件所属的 Node 上面派发出来的，需要用 node.on 来监听。
 * @event click
 * @param {Event.EventCustom} event
 * @param {Button} button - The Button component.
 */
