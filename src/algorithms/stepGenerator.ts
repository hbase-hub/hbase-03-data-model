/**
 * HBase 数据模型 — 步骤生成器
 *
 * 动画展示 HBase 数据模型的层级嵌套结构：
 * Namespace → Table → ColumnFamily → RowKey → ColumnQualifier → Cell，
 * 以及一个 Cell 的坐标 (rowKey, columnFamily:columnQualifier, timestamp) → value。
 */
import type { Step, VisualElement, VariableState } from '../types'

/** 数据模型伪代码 */
export const TEMPLATE_CODE = `// HBase 数据模型：层级嵌套与 Cell 定位
// 1. 连接并获取表（命名空间:表名）
Connection conn = ConnectionFactory.createConnection(conf);
Table table = conn.getTable(TableName.valueOf("ns:table"));

// 2. 构造 Put，指定 RowKey
Put put = new Put(Bytes.toBytes("row1"));

// 3. 添加 Cell：(cf, qualifier, timestamp, value)
byte[] cf = Bytes.toBytes("info");
byte[] qual = Bytes.toBytes("name");
long ts = 1234L;
byte[] value = Bytes.toBytes("Alice");
put.addColumn(cf, qual, ts, value);

// 4. 写入表（Cell 由四元组唯一定位）
table.put(put);

// Cell 坐标 = (RowKey, ColumnFamily:ColumnQualifier, Timestamp)
table.close();`

// 画布布局常量：自顶向下的嵌套层级
const LAYOUT = {
  namespace: { x: 60, y: 30, w: 880, h: 440, label: 'Namespace: ns' },
  table: { x: 110, y: 70, w: 780, h: 380, label: 'Table: table' },
  cfInfo: { x: 160, y: 110, w: 360, h: 320, label: 'ColumnFamily: info' },
  cfDetail: { x: 540, y: 110, w: 320, h: 320, label: 'ColumnFamily: detail' },
  row1: { x: 180, y: 150, w: 320, h: 120, label: 'RowKey: row1' },
  cellName: { x: 200, y: 190, w: 280, h: 60, label: 'Cell' },
}

/** 构造全量元素 */
function makeElements(highlight?: string): VisualElement[] {
  const mk = (
    key: keyof typeof LAYOUT,
    type: string,
    state: string,
    subLabel?: string
  ): VisualElement => {
    const l = LAYOUT[key]
    return {
      id: key,
      type,
      label: l.label,
      subLabel,
      x: l.x,
      y: l.y,
      width: l.w,
      height: l.h,
      state: key === highlight ? 'active' : state,
    }
  }
  return [
    mk('namespace', 'namespace', 'idle'),
    mk('table', 'table', 'idle'),
    mk('cfInfo', 'columnFamily', 'idle'),
    mk('cfDetail', 'columnFamily', 'idle', '（对比列族）'),
    mk('row1', 'row', 'idle'),
    mk('cellName', 'cell', 'idle', 'info:name'),
  ]
}

export function generateSteps(): Step[] {
  const steps: Step[] = []
  let idx = 0

  const push = (
    desc: string,
    line: number,
    vars: VariableState[],
    elements: VisualElement[],
    arrows: { from: string; to: string; label?: string }[] = [],
    actionLabel?: string,
    statusText?: string
  ) => {
    steps.push({
      index: idx++,
      description: desc,
      currentLine: line,
      variables: vars,
      elements,
      connections: arrows.map((a, i) => ({
        id: `arrow-${i}`,
        fromId: a.from,
        toId: a.to,
        kind: 'arrow' as const,
        label: a.label,
      })),
      annotations: [],
      actionLabel,
      statusText: statusText ?? desc,
    })
  }

  // 步骤 0：数据模型层级总览
  push(
    'HBase 数据模型层级：Namespace → Table → ColumnFamily → RowKey → ColumnQualifier → Cell',
    0,
    [],
    makeElements(),
    [
      { from: 'namespace', to: 'table', label: '包含' },
      { from: 'table', to: 'cfInfo', label: '列族' },
      { from: 'cfInfo', to: 'row1', label: '行' },
      { from: 'row1', to: 'cellName', label: 'Cell' },
    ],
    'OVERVIEW',
    '数据模型总览'
  )

  // 步骤 1：命名空间
  push(
    'Namespace（命名空间）是表的逻辑分组，类似关系库的 schema，是配额管理的基本单位',
    2,
    [{ name: 'ns', value: 'ns', line: 2, type: 'Namespace' }],
    makeElements('namespace'),
    [{ from: 'namespace', to: 'table', label: '包含表' }],
    'NAMESPACE',
    '命名空间'
  )

  // 步骤 2：获取表 ns:table
  push(
    '通过 TableName.valueOf("ns:table") 定位表，命名空间与表名以冒号分隔',
    2,
    [
      { name: 'ns', value: 'ns', line: 2, type: 'Namespace' },
      { name: 'table', value: 'ns:table', line: 2, type: 'Table' },
    ],
    makeElements('table'),
    [{ from: 'namespace', to: 'table', label: 'ns:table' }],
    'TABLE',
    '获取表'
  )

  // 步骤 3：ColumnFamily 列族
  push(
    'ColumnFamily（列族）在建表时定义，是物理存储单元；一张表可含多个列族（info / detail）',
    8,
    [
      { name: 'table', value: 'ns:table', line: 2 },
      { name: 'cf', value: 'info', line: 8, type: 'ColumnFamily' },
    ],
    makeElements('cfInfo'),
    [{ from: 'table', to: 'cfInfo', label: '列族 info' }],
    'COLUMN_FAMILY',
    '列族'
  )

  // 步骤 4：RowKey 行键
  push(
    'RowKey 是行主键，按字典序排序存储；Put 构造时指定 RowKey="row1"',
    4,
    [
      { name: 'cf', value: 'info', line: 8 },
      { name: 'rowKey', value: 'row1', line: 4, type: 'RowKey' },
    ],
    makeElements('row1'),
    [{ from: 'cfInfo', to: 'row1', label: 'RowKey' }],
    'ROWKEY',
    '行键'
  )

  // 步骤 5：ColumnQualifier 列限定符
  push(
    'ColumnQualifier（列限定符）属于某个列族，与列族共同组成列名 info:name',
    9,
    [
      { name: 'rowKey', value: 'row1', line: 4 },
      { name: 'qualifier', value: 'name', line: 9, type: 'ColumnQualifier' },
    ],
    makeElements('cellName'),
    [{ from: 'row1', to: 'cellName', label: 'info:name' }],
    'QUALIFIER',
    '列限定符'
  )

  // 步骤 6：Cell 四元组定位 + timestamp
  push(
    '一个 Cell 由 (RowKey, CF:Qualifier, Timestamp) 唯一定位，值为 value',
    10,
    [
      { name: 'rowKey', value: 'row1', line: 4 },
      { name: 'cf:cq', value: 'info:name', line: 9 },
      { name: 'timestamp', value: '1234', line: 10, type: 'long' },
      { name: 'value', value: 'Alice', line: 11, type: 'byte[]' },
    ],
    makeElements('cellName').map((e) =>
      e.id === 'cellName' ? { ...e, state: 'writing' } : e
    ),
    [],
    'CELL',
    'Cell 定位'
  )

  // 步骤 7：addColumn 写入
  push(
    'put.addColumn(cf, qual, ts, value) 将 Cell 加入 Put 对象，可一次添加多个列',
    12,
    [
      { name: 'put', value: '[info:name@1234=Alice]', line: 12, type: 'Put' },
      { name: 'timestamp', value: '1234', line: 10 },
    ],
    makeElements('cellName').map((e) =>
      e.id === 'cellName' ? { ...e, state: 'active' } : e
    ),
    [],
    'PUT',
    '构造 Put'
  )

  // 步骤 8：table.put 落库
  push(
    'table.put(put) 将 Cell 写入表，由 (RowKey, CF:CQ, TS) 唯一标识该 Cell',
    14,
    [
      { name: 'put', value: '[info:name@1234=Alice]', line: 12 },
      { name: 'cell', value: 'row1/info:name/1234', line: 14 },
    ],
    makeElements('cellName').map((e) =>
      e.id === 'cellName' ? { ...e, state: 'done' } : e
    ),
    [],
    'PUT',
    '写入完成'
  )

  // 步骤 9：坐标回顾
  push(
    'Cell 坐标 = (RowKey, ColumnFamily:ColumnQualifier, Timestamp)，是 HBase 二维+版本模型的核心',
    16,
    [
      { name: 'RowKey', value: 'row1', line: 4 },
      { name: 'CF:CQ', value: 'info:name', line: 9 },
      { name: 'Timestamp', value: '1234', line: 10 },
      { name: 'value', value: 'Alice', line: 11 },
    ],
    makeElements('cellName').map((e) => ({ ...e, state: 'done' })),
    [{ from: 'row1', to: 'cellName', label: '三元组定位' }],
    'DONE',
    '坐标总结'
  )

  return steps
}
