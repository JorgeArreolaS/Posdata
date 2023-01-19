var watch = require('node-watch')
var fs = require('fs')
var path = require('path')
var md5 = require('md5')
var chalk = require('chalk')
const { execSync, exec } = require('child_process')

const files_hash = new Map()
const remote_dirs = new Set()

const colorizeName = (f) => {
  const { dir, base } = path.parse(f)
  return chalk.cyan(dir + "/") + chalk.white(base)
}

const ignore = (f) => {
  if (/node_modules\//.test(f)) return true;
  if (/\.git/.test(f)) return true;
}
const hash = (f) => new Promise((resolve, reject) => {
  fs.readFile(f, (err, buf) => {
    if (err) {
      reject(`Error reading file: ${chalk.red(f)} wtf`)
    }
    resolve(md5(buf).slice(0, 8))
  })
})

require('dotenv').config()

const host = process.env.SYNC_REMOTE_HOST
const remote_path = process.env.SYNC_REMOTE_PATH

if (!host) {
  console.error(chalk.red("Remote address not found in environment"))
  process.exit(1)
}

if (!remote_path) {
  console.error(chalk.red("Remote path not found in environment"))
  process.exit(1)
}

console.log()
console.log(`Found host:`, chalk.cyan(host))
console.log(`With path:`, chalk.cyan(remote_path))
console.log()

const sync = async (f = "", hash = "") => {
  const initial = new Date()

  const { dir } = path.parse(f)
  if (dir && !remote_dirs.has(dir)) {
    try {
      console.log(chalk.yellow("Created Dir"), dir)
      const a = execSync(`ssh ${host} 'mkdir -p "${remote_path}/${dir}" 2>null'`)
    } catch (e) { }
    remote_dirs.add(dir)
  }
  const out = execSync(`scp -p ${f} ${host}:${remote_path}/${f}`)

  const now = new Date()
  const diff = now.getTime() - initial.getTime()
  console.log(chalk.green(`>`), colorizeName(f), chalk.greenBright("synqued"), `(${chalk.yellow(hash)})`, chalk.cyan(`~ ${diff} ms`))
}

const handleUpdate = async (f) => {
  try {

    const newHash = await hash(f)
    if (!files_hash.has(f)) {
      sync(f)
    }
    const changed = newHash !== files_hash.get(f)

    // console.log(chalk.cyan(f), newHash, 'vs', files_hash.get(f), chalk.yellow(changed))

    if (changed) {
      sync(f, newHash)
    }

    files_hash.set(f, newHash)

  } catch (e) {
    console.error(chalk.red("[ERROR]"), `Error updating`, f)
    console.error(e.message)
  }

}
const handleDelete = (f) => {
  if (files_hash.has(f))
    files_hash.delete(f)

  const a = execSync(`ssh ${host} 'rm "${remote_path}/${f}"'`)
  console.log(a)
  console.log(chalk.red(">"), f, chalk.red("deleted"))
  // TODO: Remove remote file
}

const main = async () => {
  const list = []
  recursiveReadDirSync('./', ignore, list)

  for (let item of list) {
    const _hash = await hash(item)
    files_hash.set(item, _hash)
    // console.log(chalk.yellow(">"), chalk.white(item), chalk.yellow(files_hash.get(item)))
    sync(item, _hash)
  }
  console.log(chalk.cyan("~"), 'Initial files synqued', chalk.cyan("~"), '\n')
  console.log("Listening for changes")

  watch('./', {
    recursive: true,
    filter(f, skip) {
      if (ignore(f)) return skip
      return /.+$/.test(f);
    }
  }, (evt, name) => {
    if (evt == 'update') handleUpdate(name)
    if (evt == 'remove') handleDelete(name)
  });
}

const join = require('path').join
function recursiveReadDirSync(
  dir,
  ignoreFunc,
  arr = [],
  rootDir = dir
) {
  const result = fs.readdirSync(dir)

  result.forEach((part) => {
    const path = join(dir, part)
    const pathStat = fs.statSync(path)

    if (pathStat.isDirectory()) {
      recursiveReadDirSync(path, ignoreFunc, arr, rootDir)
      return
    }
    if (ignoreFunc(path)) return
    arr.push(path)
  })

  return arr
}

main()
