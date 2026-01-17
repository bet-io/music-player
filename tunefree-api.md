# TuneHub API 接口文档

> TuneHub 是一个统一的音乐信息解析服务。它打破了不同音乐平台之间的壁垒，提供了一套标准化的 API 接口。

- **Base URL:** `https://music-dl.sayqz.com`
- **Version:** 1.0.0
- **文档地址:** https://api.tunefree.fun

---

## 目录

- [概览](#概览)
- [支持的平台](#支持的平台)
- [核心 API](#核心-api)
  - [1. 获取歌曲基本信息](#1-获取歌曲基本信息)
  - [2. 获取音乐文件链接](#2-获取音乐文件链接)
  - [3. 获取专辑封面](#3-获取专辑封面)
  - [4. 获取歌词](#4-获取歌词)
  - [5. 搜索歌曲](#5-搜索歌曲)
  - [6. 聚合搜索](#6-聚合搜索)
  - [7. 获取歌单详情](#7-获取歌单详情)
  - [8. 获取排行榜列表](#8-获取排行榜列表)
  - [9. 获取排行榜歌曲](#9-获取排行榜歌曲)
  - [10. 系统状态](#10-系统状态)
  - [11. 健康检查](#11-健康检查)
- [统计分析 API](#统计分析-api)
  - [12. 获取统计数据](#12-获取统计数据)
  - [13. 获取统计摘要](#13-获取统计摘要)
  - [14. 平台统计概览](#14-平台统计概览)
  - [15. QPS 统计](#15-qps-统计)
  - [16. 趋势数据](#16-趋势数据)
  - [17. 请求类型统计](#17-请求类型统计)
- [高级特性](#高级特性)

---

## 概览

TuneHub API 提供统一的音乐服务接口，支持多个主流音乐平台的数据获取。

**实时统计看板特性：**
- 今日总调用数
- 成功率统计
- 平均请求耗时
- 平均 QPS
- 平台调用占比
- Top 5 接口类型

---

## 支持的平台

| 平台标识 (source) | 平台名称 | 状态 |
|-------------------|----------|------|
| `netease` | 网易云音乐 | ✅ 已启用 |
| `kuwo` | 酷我音乐 | ✅ 已启用 |
| `qq` | QQ音乐 | ✅ 已启用 |

---

## 核心 API

### 1. 获取歌曲基本信息

获取歌曲的名称、歌手、专辑等基本元数据信息。

**请求：**
```http
GET /api/?source={source}&id={id}&type=info
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "name": "歌曲名称",
    "artist": "歌手名称",
    "album": "专辑名称",
    "url": "https://music-dl.sayqz.com/api/?source=netease&id=123456&type=url",
    "pic": "https://music-dl.sayqz.com/api/?source=netease&id=123456&type=pic",
    "lrc": "https://music-dl.sayqz.com/api/?source=netease&id=123456&type=lrc"
  },
  "timestamp": "2025-11-23T12:00:00.000+08:00"
}
```

---

### 2. 获取音乐文件链接

**请求：**
```http
GET /api/?source={source}&id={id}&type=url&br=[320k]
```

**音质参数 (br) 对照表：**

| 值 | 说明 | 比特率 |
|----|------|---------|
| `128k` | 标准音质 | 128kbps |
| `320k` | 高品质 | 320kbps |
| `flac` | 无损音质 | ~1000kbps |
| `flac24bit` | Hi-Res 音质 | ~1400kbps |

**响应说明：**
- 成功时返回 `302 Redirect` 到实际的音乐文件 URL
- **自动换源**：当请求的原平台失败时，系统会自动尝试其他平台。此时响应头会包含 `X-Source-Switch` 字段（例如：`netease -> kuwo`）

---

### 3. 获取专辑封面

获取歌曲的专辑封面图片。

**请求：**
```http
GET /api/?source={source}&id={id}&type=pic
```

**响应：** `302 Redirect to image URL`

---

### 4. 获取歌词

获取歌曲的 LRC 格式歌词。

**请求：**
```http
GET /api/?source={source}&id={id}&type=lrc
```

**响应示例 (Text/Plain)：**
```
[00:00.00]歌词第一行
[00:05.50]歌词第二行
[00:10.20]歌词第三行
```

---

### 5. 搜索歌曲

**请求：**
```http
GET /api/?source={source}&type=search&keyword={keyword}&limit=[20]
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "keyword": "周杰伦",
    "total": 10,
    "results": [
      {
        "id": "123456",
        "name": "歌曲名称",
        "artist": "周杰伦",
        "album": "专辑名称",
        "url": "https://music-dl.sayqz.com/api/?...",
        "platform": "netease"
      }
    ]
  }
}
```

---

### 6. 聚合搜索

**请求：**
```http
GET /api/?type=aggregateSearch&keyword={keyword}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "keyword": "周杰伦",
    "results": [
      {
        "id": "123456",
        "name": "歌曲名称",
        "artist": "周杰伦",
        "platform": "netease"
      },
      {
        "id": "789012",
        "name": "另一首歌",
        "artist": "周杰伦",
        "platform": "kuwo"
      }
    ]
  }
}
```

---

### 7. 获取歌单详情

**请求：**
```http
GET /api/?source={source}&id={id}&type=playlist
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "123456",
        "name": "歌曲名称",
        "types": ["flac", "320k", "128k"]
      }
    ],
    "info": {
      "name": "歌单名称",
      "author": "创建者"
    }
  }
}
```

---

### 8. 获取排行榜列表

**请求：**
```http
GET /api/?source={source}&type=toplists
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "19723756",
        "name": "飙升榜",
        "updateFrequency": "每天更新"
      }
    ]
  }
}
```

---

### 9. 获取排行榜歌曲

**请求：**
```http
GET /api/?source={source}&id={id}&type=toplist
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "123456",
        "name": "歌曲名称"
      }
    ],
    "source": "netease"
  }
}
```

---

### 10. 系统状态

**请求：**
```http
GET /status
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "status": "running",
    "platforms": {
      "netease": {
        "enabled": true
      }
    }
  }
}
```

---

### 11. 健康检查

**请求：**
```http
GET /health
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "status": "healthy"
  }
}
```

---

## 统计分析 API

> 所有数据均使用 **UTC+8（北京时间）** 时区。

### 12. 获取统计数据

**请求：**
```http
GET /stats?period=[today]&groupBy=[platform]
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "period": "today",
    "overall": {
      "total_calls": 15420,
      "success_calls": 14856,
      "success_rate": 96.34,
      "avg_duration": 245.67
    },
    "breakdown": [
      {
        "group_key": "netease",
        "total_calls": 8234,
        "success_rate": 97.13
      }
    ],
    "qps": {
      "avg_qps": 0.1785,
      "peak_qps": 2.4567
    }
  }
}
```

---

### 13. 获取统计摘要

**请求：**
```http
GET /stats/summary
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "today": {
      "total_calls": 15420,
      "success_rate": 96.34
    },
    "week": {
      "total_calls": 98765
    },
    "top_platforms_today": [
      {
        "group_key": "netease",
        "total_calls": 8234
      }
    ]
  }
}
```

---

### 14. 平台统计概览

**请求：**
```http
GET /stats/platforms?period=[today]
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "platforms": {
      "netease": {
        "total_calls": 8234,
        "success_rate": 97.13
      },
      "kuwo": {
        "total_calls": 4521,
        "success_rate": 97.08
      }
    }
  }
}
```

---

### 15. QPS 统计

**请求：**
```http
GET /stats/qps?period=[today]
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "qps": {
      "avg_qps": 0.1785,
      "peak_qps": 2.4567,
      "hourly_data": [
        {
          "date": "2025-11-24",
          "hour": 14,
          "calls": 8845,
          "qps": "2.4569"
        }
      ]
    }
  }
}
```

---

### 16. 趋势数据

**请求：**
```http
GET /stats/trends?period=[week]
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "trends": [
      {
        "date": "2025-11-17",
        "total_calls": 12345,
        "success_rate": 96.20
      },
      {
        "date": "2025-11-18",
        "total_calls": 13567,
        "success_rate": 96.48
      }
    ]
  }
}
```

---

### 17. 请求类型统计

**请求：**
```http
GET /stats/types?period=[today]
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "requestTypes": {
      "url": {
        "total_calls": 6234,
        "success_rate": 96.21
      },
      "info": {
        "total_calls": 4521,
        "success_rate": 98.56
      }
    }
  }
}
```

---

## 高级特性

### 🔄 自动换源 (Auto-Switch)

当请求 `type=url` 时，如果原平台获取失败，系统会自动按配置优先级尝试其他平台。

**换源优先级：**
1. kuwo (酷我音乐)
2. netease (网易云音乐)
3. qq (QQ音乐)

当发生换源时，响应头会包含 `X-Source-Switch` 字段（例如：`netease -> kuwo`）。

---

### 🔍 聚合搜索 (Aggregate Search)

使用 `aggregateSearch` 可以一次性并发请求所有启用的平台，并对结果进行智能混合排列。

**特性：**
- 并发请求，速度快
- 自动去重
- 支持统一分页

---

## 免责声明

本 API 仅供个人学习研究使用，禁止用于商业及非法用途。使用本 API 所产生的一切后果由使用者自行承担，开发者不承担任何责任。

---

## 联系方式

- **QQ 群:** [TuneFree灌水交流](https://qm.qq.com/q/FfePP9WRRQ)
- **邮件:** i@sayqz.com

---

**© 2025 TuneHub API Documentation.**
