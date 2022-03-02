# Pinger

This is a small tool based on NodeJS (node:alpine) which pings a list of host on a set interval and exposes the result as prometheus metrics.

## Configuration

You can configure it by passing in the following arguments:

| Paramter | Short | Description | Type | Default |
|:- | :- |:- |:-|:- |
|--ping-interval | -t | The Interval in seconds to ping | number | 10|
|--hosts| -h | List of Hosts to ping | string[] | - |
|--port | -p | Port to listen on (better to use host port mapping) | number | 9500|
|--listen|-i|Interface to listen on (you probably want the default here) | string | 0.0.0.0|
|--enable-logging|-l|Expose more detailed log to stdout | boolean | false|

## Example Call

```
docker run -p 9500:9500 snapstromegon/pinger --hosts www.google.de 1.1.1.1
```

## Exposed Metrics

### Endpoints

The container exposes two endpoints.

- `/metrics` for Prometheus style metrics
- `/metrics/json` ffor the same metrics in JSON style

### Available Metrics

| Metric | Description | Type |
|:- |:- |:- |
| ping_time_duration | Roundtrip time of last completed ping | number |
| ping_alive | Was the last ping successful? | boolean (0=false / 1=true in prometheus) |
|ping_last_ping_seconds | Unix Timestamp of last sent ping | number |
|ping_last_pong_seconds | Unix Timestamp of last received answer | number |
|ping_pings_alive|Number of pings since start which were alive | number |
|ping_pings_total| Total number of pings since start | number |

Each set of metrics is repeated for each host.

#### Prometheus
```
ping_time_duration{host="<host>"} 0.011
ping_alive{host="<host>"} 1
ping_last_ping_seconds{host="<host>"} 1646251954.372
ping_last_pong_seconds{host="<host>"} 1646251954.443
ping_pings_alive{host="<host>"} 5
ping_pings_total{host="<host>"} 10
```

#### JSON
```json
[
  {
    "tags": { "host": "<host>" },
    "metrics": {
      "ping_time_duration": 0.013,
      "ping_alive": true,
      "ping_last_ping_seconds": 1646252094.464,
      "ping_last_pong_seconds": 1646252094.494,
      "ping_pings_alive": 5,
      "ping_pings_total": 10
    }
  }
]
```