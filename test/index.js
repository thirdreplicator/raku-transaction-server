import server from '../src/server'

const app = server.app.listen(3000)
server.live = app

import './app/app_test'

after(done => {
  server.close(app)
  done()
})
