const MockMongo = require('.')

describe('mock-mongo', () => {
  test('findOne', () => {
    const db = new MockMongo({
      col: [{ _id: 'myObj', foo: 'bar' }],
    })
    const obj = db.collection('col').findOne({ _id: 'myObj' })
    expect(obj.foo).toBe('bar')
  })

  test('find', () => {
    const db = new MockMongo({
      col: [
        { _id: 'myObj', foo: 'bar' },
        { _id: 'myOtherObj', foo: 'bar' },
        { _id: 'anotherObj', foo: 'xyz' },
      ],
    })
    const result = db
      .collection('col')
      .find({ foo: 'bar' })
      .toArray()

    expect(result).toHaveLength(2)
  })

  test('limit', () => {
    const db = new MockMongo({
      col: [
        { _id: 'myObj', foo: 'bar' },
        { _id: 'myOtherObj', foo: 'bar' },
        { _id: 'anotherObj', foo: 'bar' },
      ],
    })
    const result = db
      .collection('col')
      .find({ foo: 'bar' })
      .limit(2)
      .toArray()

    expect(result).toHaveLength(2)
  })

  test('sort', () => {
    const db = new MockMongo({
      col: [
        { _id: 'myObj', foo: 1 },
        { _id: 'myOtherObj', foo: 3 },
        { _id: 'anotherObj', foo: 2 },
      ],
    })
    const result = db
      .collection('col')
      .find()
      .sort({ foo: 1 })
      .toArray()

    expect(result[0]._id).toBe('myObj')
    expect(result[1]._id).toBe('anotherObj')
    expect(result[2]._id).toBe('myOtherObj')
  })

  test('limit + sort', () => {
    const db = new MockMongo({
      col: [
        { _id: 'myObj', foo: 1 },
        { _id: 'myOtherObj', foo: 3 },
        { _id: 'anotherObj', foo: 2 },
      ],
    })
    const result = db
      .collection('col')
      .find()
      .sort({ foo: -1 })
      .limit(1)
      .toArray()

    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe('myOtherObj')
  })

  test('simple aggregate', () => {
    const db = new MockMongo({
      col: [
        { _id: 'myObj', foo: 1 },
        { _id: 'myOtherObj', foo: 3 },
        { _id: 'anotherObj', foo: 2 },
      ],
    })
    const result = db
      .collection('col')
      .aggregate([
        { $match: { foo: { $lte: 2 } } },
        { $sort: { foo: -1 } },
        {
          $project: {
            newProp: { $add: ['$foo', 1] },
          },
        },
      ])
      .toArray()

    expect(result).toMatchSnapshot()
  })

  test('aggregate with lookup', () => {
    const db = new MockMongo({
      foos: [{ _id: 'foo1', barId: 'bar1' }],
      bars: [{ _id: 'bar1' }],
    })

    const result = db
      .collection('foos')
      .aggregate([
        {
          $lookup: {
            from: 'bars',
            localField: 'barId',
            foreignField: '_id',
            as: 'bars',
          },
        },
      ])
      .toArray()

    expect(result).toMatchSnapshot()
  })

  test('insertOne', () => {
    const db = new MockMongo({})

    db.collection('stuff').insertOne({ _id: 'myObj', foo: 'bar' })
    const stuff = db
      .collection('stuff')
      .find()
      .toArray()

    expect(db.data).toMatchSnapshot()
  })

  test('insertMany', () => {
    const db = new MockMongo({
      foos: [{ _id: 'foo1', a: 1 }],
    })

    db.collection('foos').insertMany([{ _id: 'foo2' }, { _id: 'foo3', a: 1 }])

    expect(db.data).toMatchSnapshot()
  })

  test('update', () => {
    const db = new MockMongo({
      objs: [
        { _id: 'foo1', a: 1 },
        { _id: 'bar1', a: 1 },
        { _id: 'bar1', a: 2 },
      ],
    })

    db.collection('objs').update({ a: 1 }, { $set: { a: 3 } })

    const as = db
      .collection('objs')
      .find()
      .map(obj => obj.a)

    expect(as.filter(a => a === 1)).toHaveLength(1)
    expect(as.filter(a => a === 2)).toHaveLength(1)
    expect(as.filter(a => a === 3)).toHaveLength(1)
  })

  test('multi update', () => {
    const db = new MockMongo({
      objs: [
        { _id: 'foo1', a: 1 },
        { _id: 'bar1', a: 1 },
        { _id: 'bar1', a: 2 },
      ],
    })

    db.collection('objs').update({ a: 1 }, { $set: { a: 3 } }, { multi: true })

    const as = db
      .collection('objs')
      .find()
      .map(obj => obj.a)

    expect(as.filter(a => a === 3)).toHaveLength(2)
    expect(as.filter(a => a === 2)).toHaveLength(1)
  })

  test('update with nothing to update', () => {
    const db = new MockMongo({
      objs: [
        { _id: 'foo1', a: 1 },
        { _id: 'bar1', a: 1 },
        { _id: 'bar1', a: 2 },
      ],
    })

    db.collection('objs').update({ a: 3 }, { $set: { a: 3 } })

    const as = db
      .collection('objs')
      .find()
      .map(obj => obj.a)

    expect(as.filter(a => a === 1)).toHaveLength(2)
    expect(as.filter(a => a === 2)).toHaveLength(1)
  })

  test('findOneAndUpdate', () => {
    const db = new MockMongo({
      objs: [
        { _id: 'foo1', a: 1 },
        { _id: 'bar1', a: 1 },
        { _id: 'bar1', a: 2 },
      ],
    })

    const obj = db
      .collection('objs')
      .findOneAndUpdate({ a: 1 }, { $set: { a: 3 } })

    const as = db
      .collection('objs')
      .find()
      .map(obj => obj.a)

    expect(as.filter(a => a === 1)).toHaveLength(1)
    expect(as.filter(a => a === 2)).toHaveLength(1)
    expect(as.filter(a => a === 3)).toHaveLength(1)

    expect(obj.a).toBe(1)
  })

  test('findOneAndUpdate with returnOriginal', () => {
    const db = new MockMongo({
      objs: [
        { _id: 'foo1', a: 1 },
        { _id: 'bar1', a: 1 },
        { _id: 'bar1', a: 2 },
      ],
    })

    const obj = db
      .collection('objs')
      .findOneAndUpdate({ a: 1 }, { $set: { a: 3 } }, { returnOriginal: false })

    const as = db
      .collection('objs')
      .find()
      .map(obj => obj.a)

    expect(as.filter(a => a === 1)).toHaveLength(1)
    expect(as.filter(a => a === 2)).toHaveLength(1)
    expect(as.filter(a => a === 3)).toHaveLength(1)

    expect(obj.a).toBe(3)
  })

  test('findOneAndUpdate with nothing to update', () => {
    const db = new MockMongo({
      objs: [
        { _id: 'foo1', a: 1 },
        { _id: 'bar1', a: 1 },
        { _id: 'bar1', a: 2 },
      ],
    })

    const obj = db
      .collection('objs')
      .findOneAndUpdate({ a: 3 }, { $set: { a: 3 } })

    const as = db
      .collection('objs')
      .find()
      .map(obj => obj.a)

    expect(as.filter(a => a === 1)).toHaveLength(2)
    expect(as.filter(a => a === 2)).toHaveLength(1)

    expect(obj).toBeUndefined()
  })

  test('unwind', () => {
    const db = new MockMongo({
      objs: [
        {
          _id: 'foo',
          arr: [1, 2, 3, 4, 5],
        },
      ],
    })

    const res = db
      .collection('objs')
      .aggregate([{ $unwind: '$arr' }])
      .toArray()

    expect(res).toHaveLength(5)
    expect(res).toMatchSnapshot()
  })
})
