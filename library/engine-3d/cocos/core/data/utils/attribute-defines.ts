
export interface IExposedAttributes {
    /**
     * 指定属性的类型。
     */
    type?: any;

    /**
     *
     */
    url?: string;

    /**
     * 控制是否在编辑器中显示该属性。
     */
    visible?: boolean | (() => boolean);

    /**
     * 该属性在编辑器中的显示名称。
     */
    displayName?: string;

    /**
     *
     */
    displayOrder?: number;

    /**
     * 该属性在编辑器中的工具提示内容。
     */
    tooltip?: string;

    /**
     *
     */
    multiline?: boolean;

    /**
     * 指定该属性是否为可读的。
     */
    readonly?: boolean;

    /**
     * 当该属性为数值类型时，指定了该属性允许的最小值。
     */
    min?: number;

    /**
     * 当该属性为数值类型时，指定了该属性允许的最大值。
     */
    max?: number;

    /**
     * 当该属性为数值类型时并在编辑器中提供了滑动条时，指定了滑动条的步长。
     */
    step?: number;

    /**
     * 当该属性为数值类型时，指定了该属性允许的范围。
     */
    range?: number[];

    /**
     * 当该属性为数值类型时，是否在编辑器中提供滑动条来调节值。
     */
    slide?: boolean;

    /**
     * 该属性是否参与序列化和反序列化。
     */
    serializable?: boolean;

    /**
     * 该属性的曾用名。
     */
    formerlySerializedAs?: string;

    /**
     * 该属性是否仅仅在编辑器环境中生效。
     */
    editorOnly?: boolean;

    /**
     * 是否覆盖基类中的同名属性。
     */
    override?: boolean;

    /**
     *
     */
    animatable?: boolean;

    /**
     *
     */
    unit?: string;

    /**
     * 转换为弧度
     */
    radian?: boolean;

    /**
     * 注意：这是一个内部选项。
     * 此选项是为了在 `@property` 的基础上精确实现 `@serializable`、`@editable`以及所有新增的独立装饰器的行为。
     * 
     * 当此字段为 `true` 时。以下规则将不再生效：
     * - 只要 `@property` 未显式指定选项 `.serializable === false`，就开启序列化；
     * - 只要 `@property` 未显式指定选项 `.visible === false` 且目标属性的名称不以下划线开头，就开启编辑器交互。
     * 反之，由以下规则取代：
     * - 当且仅当 `@property` 显式指定了 `.serializable === true` 时才开启序列化；
     * - 当且仅当 `@property` 显式指定了 `.visible === true` 时才开启编辑器交互。
     */
    __noImplicit?: boolean;
}

export interface IAcceptableAttributes extends IExposedAttributes {
    _short?: boolean;
}
