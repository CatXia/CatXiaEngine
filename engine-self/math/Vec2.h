/*
 * Vec2 
 */
#include <algorithm>
#include <functional>
#include <cmath>

namespace catxia {
    class Vec2 {
        public:
            float x = 0.0f;
            float y = 0.0f;

            Vec2();
            Vec2(float xx, float yy);
            Vec2(const float* array);
            Vec2(const Vec2& p1, const Vec2& p2);
            // 角度
            static float angle(const Vec2& p1, const Vec2& p2);
            // 加法
            inline void add(const Vec2& p);
            static void add(const Vec2& p1, const Vec2& p2, Vec2* dst);
            // 限定
            void clamp(const Vec2& min, const Vec2& max);
            static void clamp(const Vec2& v, const Vec2& min, const Vec2& max, Vec2* dst);
            // 距离
            float distance(const Vec2& v) const;
            // 点积
            inline float dot(const Vec2& v) const;
            static float dot(const Vec2& v1, const Vec2& v2);
            // 长度
            float length() const;
            // 取反
            inline void negate();
            // 等比缩小到长度为1
            void normalize();
            Vec2 getNormalized() const;
            // 放大缩小
            inline void scale(float scalar);
            inline void scale(const Vec2& scale);
            // 旋转
            void rotate(const Vec2& point, float angle);
            // 设置
            inline void set(float xx, float yy);
            void set(const float* array);
            inline void set(const Vec2& v);
            inline void set(const Vec2& p1, const Vec2& p2);
            // 减法
            inline void subtract(const Vec2& v);
            static void subtract(const Vec2& v1, const Vec2& v2, Vec2* dst);
            // 重载操作符
            // add
            inline Vec2 operator+(const Vec2& v) const;
            inline Vec2& operator+=(const Vec2& v);
            // subtract
            inline Vec2 operator-(const Vec2& v) const;
            inline Vec2& operator-=(const Vec2& v);
            // negate
            inline Vec2 operator-() const;
            // scale
            inline Vec2 operator*(float s) const;
            inline Vec2& operator*=(float s);
            // 除法
            inline Vec2 operator/(float s) const;
            // 比较
            inline bool operator<(const Vec2& v) const;
            inline bool operator>(const Vec2& v) const;
            inline bool operator==(const Vec2& v) const;
            inline bool operator!=(const Vec2& v) const;
    };

    inline Vec2 operator*(float x, const Vec2& v);
}

#include "math/Vec2.inl"
