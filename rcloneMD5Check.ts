import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { existsSync } from "https://deno.land/std@0.224.0/fs/mod.ts";

const params = Deno.args;

if (params.length !== 1) {
  console.error('Usage: rcloneMD5Check.exe <Local Path>');
  Deno.exit(1);
}

const localPath = params[0];
const dbPath = "./md5hashes.sqlite";

type HashFile = {
  hash: string;
  file: string;
}

const getLocalHashes = async (path: string): Promise<HashFile[]> => {
  const command = new Deno.Command(
    "rclone",
    {
      args: ['md5sum', path],
      stdout: "piped",
      stderr: "piped",
    },
  );

  const result = await command.output();
  if (result.code !== 0) {
    console.error("rcloneの実行に失敗しました:");
    console.error(new TextDecoder().decode(result.stderr));
    Deno.exit(result.code);
  }

  const text = new TextDecoder().decode(result.stdout);
  if (!text.trim()) {
    return [];
  }

  const lines: HashFile[] = text.trim().split('\n')
    .map((line) => {
      const [hash, file] = line.trim().split(/\s+/);
      return ({ hash, file });
    })
    .sort((a, b) => a.file.localeCompare(b.file));

  return lines;
};

const dbExists = existsSync(dbPath);
const db = new DB(dbPath);

db.execute(`
  CREATE TABLE IF NOT EXISTS hashes (
    file TEXT PRIMARY KEY,
    hash TEXT NOT NULL
  )
`);

const currentHashes = await getLocalHashes(localPath);
const diffs: { file: string; hash_l?: string; hash_db?: string; status: 'add' | 'modify' | 'delete' }[] = [];

if (!dbExists) {
  console.error("データベースが見つかりません。すべてのファイルを新規追加として扱います。");
  for (const item of currentHashes) {
    diffs.push({ file: item.file, hash_l: item.hash, status: 'add' });
  }
}
else {
  const dbHashes: HashFile[] = [];
  for (const [file, hash] of db.query<[string, string]>("SELECT file, hash FROM hashes")) {
    dbHashes.push({ file, hash });
  }
  dbHashes.sort((a, b) => a.file.localeCompare(b.file));

  // 現在のファイルを基準に比較
  for (const item_l of currentHashes) {
    const item_db = dbHashes.find((item) => item.file === item_l.file);
    if (item_db) {
      if (item_l.hash !== item_db.hash) {
        diffs.push({ file: item_l.file, hash_l: item_l.hash, hash_db: item_db.hash, status: 'modify' });
      }
    }
    else {
      diffs.push({ file: item_l.file, hash_l: item_l.hash, status: 'add' });
    }
  }

  // データベースのファイルを基準に削除を検出
  for (const item_db of dbHashes) {
    const item_l = currentHashes.find((item) => item.file === item_db.file);
    if (!item_l) {
      diffs.push({ file: item_db.file, hash_db: item_db.hash, status: 'delete' });
    }
  }
}

const encoder = new TextEncoder();

// 差分を出力
if (diffs.length > 0) {
  for (const diff of diffs) {
    Deno.stdout.writeSync(encoder.encode(diff.file + '\n'));

    switch (diff.status) {
      case 'add':
        Deno.stderr.writeSync(encoder.encode(`  [追加] ファイル: ${diff.file}, ハッシュ: ${diff.hash_l}\n`));
        break;
      case 'modify':
        Deno.stderr.writeSync(encoder.encode(`  [変更] ファイル: ${diff.file}\n`));
        Deno.stderr.writeSync(encoder.encode(`    現在のハッシュ: ${diff.hash_l}\n`));
        Deno.stderr.writeSync(encoder.encode(`    以前のハッシュ: ${diff.hash_db}\n`));
        break;
      case 'delete':
        Deno.stderr.writeSync(encoder.encode(`  [削除] ファイル: ${diff.file}, 以前のハッシュ: ${diff.hash_db}\n`));
        break;
    }
  }
}
else {
  Deno.stderr.writeSync(encoder.encode("差分はありませんでした。\n"));
}

// データベースを更新
db.query("DELETE FROM hashes");
for (const { file, hash } of currentHashes) {
  db.query("INSERT INTO hashes (file, hash) VALUES (?, ?)", [file, hash]);
}
db.close();
