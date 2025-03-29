const params = Deno.args;

if (params.length !== 2) {
  console.error('Usage: rcloneMD5Check.exe <local path> <remote path>');
  Deno.exit(1);
}

type HashFile = {
  hash: string;
  file: string;
}

const execCommand = async (path: string): Promise<HashFile[]> => {
  const command = new Deno.Command(
    "rclone",
    {
      args: ['md5sum', '--download', path],
    },
  );  

  let text: string;
  const result: Deno.CommandOutput = await command.output();
  if (result.code === 0) {
    text = new TextDecoder().decode(result.stdout);
  }
  else {
    console.error(new TextDecoder().decode(result.stderr));
    Deno.exit(result.code);
  }

  const lines: HashFile[] = text.trim().split('\n')
    .map((line) => {
      const [hash, file] = line.trim().split(/\s+/);
      return ({ hash, file })
    })
    .sort((a, b) => { return a.file < b.file ? 1 : -1; });

  return lines;
};

const lines_l = await execCommand(params[0]);
const lines_r = await execCommand(params[1]);

// 差分を検出してマークするコード
const diffs: { file: string; hash_l?: string; hash_r?: string; status: 'add' | 'modify' | 'delete' }[] = [];

// lines_l を基準に比較
for (const item_l of lines_l) {
  const item_r = lines_r.find((item) => item.file === item_l.file);
  if (item_r) {
    if (item_l.hash !== item_r.hash) {
      diffs.push({ file: item_l.file, hash_l: item_l.hash, hash_r: item_r.hash, status: 'modify' });
    }
  }
  else {
    // lines_lにあって、lines_rにない→追加
    diffs.push({ file: item_l.file, hash_l: item_l.hash, status: 'add' });
  }
}

// lines_r にのみ存在するファイルを確認
for (const item_r of lines_r) {
  const item_l = lines_l.find((item) => item.file === item_r.file);
  if (!item_l) {
    diffs.push({ file: item_r.file, hash_r: item_r.hash, status: 'delete' });
  }
}

const encoder = new TextEncoder();

// 差分を出力
if (diffs.length > 0) {
  for (const diff of diffs) {
    Deno.stdout.writeSync(encoder.encode(diff.file + '\n'));

    switch (diff.status) {
      case 'add':
        
        Deno.stderr.writeSync(encoder.encode(`  [ADD] File: ${diff.file}, Local Hash: ${diff.hash_l}\n`));
        break;
      case 'modify':
        Deno.stderr.writeSync(encoder.encode(`  [MODIFY] File: ${diff.file}\n`));
        Deno.stderr.writeSync(encoder.encode(`    Local Hash: ${diff.hash_l}\n`));
        Deno.stderr.writeSync(encoder.encode(`    Remote Hash: ${diff.hash_r}\n`));
        break;
      case 'delete':
        Deno.stderr.writeSync(encoder.encode(`  [DELETE] File: ${diff.file}, Remote Hash: ${diff.hash_r}\n`));
        break;
    }
  }
}
else {
  Deno.stderr.writeSync(encoder.encode("No differences found.\n"));
}
