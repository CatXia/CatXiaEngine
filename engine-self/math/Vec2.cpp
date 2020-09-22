/*
 * 
 */
#include "math/Vec2.h"
namespace catxia {
    float Vec2::angle(const Vec2& v1, const Vec2& v2)
    {
        float dz = v1.x * v2.y - v1.y * v2.x;
        return atan2f(fabsf(dz) + MATH_FLOAT_SMALL, dot(v1, v2));
    }

    void Vec2::add(const Vec2& v1, const Vec2& v2, Vec2* dst)
    {
        // GP_ASSERT(dst);

        dst->x = v1.x + v2.x;
        dst->y = v1.y + v2.y;
    }

    void Vec2::clamp(const Vec2& min, const Vec2& max)
    {
        // GP_ASSERT(!(min.x > max.x || min.y > max.y ));

        if (x < min.x) {
            x = min.x;
        }
        if (x > max.x) {
            x = max.x;
        }
        if (y < min.y) {
            y = min.y;
        }
        if (y > max.y) {
            y = max.y;
        }
    }

    void Vec2::clamp(const Vec2& v, const Vec2& min, const Vec2& max, Vec2* dst)
    {
        // GP_ASSERT(dst);
        // GP_ASSERT(!(min.x > max.x || min.y > max.y ));

        dst->x, dst->y = v.x, v.y;
        if (dst->x < min.x) {
            dst->x = min.x;
        }
        if (dst->x > max.x) {
            dst->x = max.x;
        }
        if (dst->y < min.y) {
            dst->y = min.y;
        }
        if (dst->y > max.y) {
            dst->y = max.y;
        }
    }

    float Vec2::distance(const Vec2& v) const
    {
        float dx = v.x - x;
        float dy = v.y - y;

        return std::sqrt(dx * dx + dy * dy);
    }

    float Vec2::dot(const Vec2& v1, const Vec2& v2)
    {
        return (v1.x * v2.x + v1.y * v2.y);
    }

    float Vec2::length() const
    {
        return std::sqrt(x * x + y * y);
    }

    void Vec2::normalize()
    {
        float n = x * x + y * y;
        if (n == 1.0f)
            return;
        n = std::sqrt(n);
        if (n < MATH_TOLERANCE)
            return;   
        n = 1.0f / n;
        x *= n;
        y *= n;
    }

    Vec2 Vec2::getNormalized() const
    {
        Vec2 v(*this);
        v.normalize();
        return v;
    }

    void Vec2::rotate(const Vec2& point, float angle)
    {
        float sinAngle = std::sin(angle);
        float cosAngle = std::cos(angle);

        float tempX = x - point.x;
        float tempY = y - point.y;

        x = tempX * cosAngle - tempY * sinAngle + point.x;
        y = tempY * cosAngle + tempX * sinAngle + point.y;
    }
}