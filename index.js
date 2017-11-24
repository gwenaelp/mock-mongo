const mingo = require('mingo')

module.exports = class MockMongo {
  constructor(data) {
    this.data = data
    this.collection = this.collection.bind(this)
  }

  collection(name) {
    this.data[name] = this.data[name] || []
    return new Collection(this.data, name)
  }
}

class Collection {
  constructor(data, collectionName) {
    this.data = data
    this.collectionName = collectionName

    this.find = this.find.bind(this)
    this.findOne = this.findOne.bind(this)
    this.aggregate = this.aggregate.bind(this)
  }

  find(query) {
    const cursor = mingo.find(this.data[this.collectionName], query)
    cursor.toArray = cursor.all
    return cursor
  }

  findOne(query) {
    const cursor = mingo.find(this.data[this.collectionName], query)
    return cursor.first()
  }

  aggregate(pipeline) {
    const rewrittenPipeline = pipeline.map(stage => {
      if ('$lookup' in stage) {
        const foreignCollectionName = stage.$lookup.from
        return {
          $lookup: {
            from: this.data[foreignCollectionName] || [],
            localField: stage.$lookup.localField,
            foreignField: stage.$lookup.foreignField,
            as: stage.$lookup.as,
          },
        }
      }
      return stage
    })

    const result = mingo.aggregate(
      this.data[this.collectionName],
      rewrittenPipeline,
    )
    return {
      toArray: () => result,
    }
  }
}
