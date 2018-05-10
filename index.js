const mingo = require('mingo')

const updateDocument = (document, update) =>
  Object.keys(update.$set).forEach(key => {
    document[key] = update.$set[key]
  })

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
    return cursor.next()
  }

  insertOne(object) {
    this.insertMany([object])
  }

  insertMany(objects) {
    const existingIds = new Set(this.data[this.collectionName].map(o => o._id))
    for (const object of objects) {
      if (!object._id) {
        throw new Error(
          'mock-mongo does not currently support inserting objects without _id',
        )
      }
      if (existingIds.has(object._id)) {
        throw new Error(`Object with _id ${object._id} already in collection`)
      }
      existingIds.add(object._id)
    }

    this.data[this.collectionName] = [
      ...this.data[this.collectionName],
      ...objects,
    ]
  }

  update(filter, update, options = {}) {
    const cursor = mingo.find(this.data[this.collectionName], filter)
    const objects = cursor.all()
    if (options.multi) {
      objects.forEach(obj => updateDocument(obj, update))
    } else if (objects[0]) {
      updateDocument(objects[0], update)
    }
  }

  findOneAndUpdate(filter, update, options = {}) {
    if (options.returnOriginal === undefined) {
      options.returnOriginal = true
    }

    const existingObj = this.findOne(filter)

    if (!existingObj) {
      return
    }

    const existingObjCopy = Object.assign({}, existingObj)

    this.update(filter, update, { multi: false })

    if (!options.returnOriginal) {
      // existingObj will have been updated by the call to update
      return existingObj
    }
    return existingObjCopy
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
