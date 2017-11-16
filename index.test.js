const MockMongoDb = require('.')

describe('mock-mongo-db', () => {
  test('findOne', () => {
    const db = new MockMongoDb({
      col: [{ _id: 'myObj', foo: 'bar' }],
    })
    const obj = db.collection('col').findOne({ _id: 'myObj' })
    expect(obj.foo).toBe('bar')
  })

  test('find', () => {
    const db = new MockMongoDb({
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
    const db = new MockMongoDb({
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
    const db = new MockMongoDb({
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
    const db = new MockMongoDb({
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
    const db = new MockMongoDb({
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
    const db = new MockMongoDb({
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
})
