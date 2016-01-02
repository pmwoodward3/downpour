import {Pipe, PipeTransform} from 'angular2/core';
import {suffix} from './bytes';

@Pipe({
  name: 'object',
})
export class ObjectFilterPipe implements PipeTransform {
  transform(value: any[], args: any[]): any {
    var queryString = args[0];
    if (!queryString)
      return value;

    var ast = [];
    for (var i = 0; i < toFilterBy.length; i++) {
      var re = new RegExp(`${toFilterBy[i]}: ?(\\S+)`);

      queryString = queryString.replace(re, (match, p1) => {
        if (p1) ast.push([p1, toFilterBy[i]]);
        return '';
      });
    }

    for (var i = 0; i < toCompareBy.length; i++) {
      var re = new RegExp(`${toCompareBy[i][0]} ?([><]) ?([\\d.]+)(\\w?b)?`, 'gi');

      queryString = queryString.replace(re, (match, p1, p2, p3) => {
        if (match) {
          var normFunc = toCompareBy[i][2];
          var normalized;
          if (normFunc) {
            normalized = normFunc(Number(p2), p3);
          } else {
            normalized = Number(p2);
          }
          if (normalized !== undefined)
            ast.push([p1, normalized, toCompareBy[i][1]]);
        }
        return '';
      });
    }
    return value.filter((v, i) => {
      for (var j = 0; j < ast.length; j++) {
        var st = ast[j];
        if (st.length == 2) {
          if (st[0].toLowerCase() != v[st[1]].toLowerCase()) return false;
        } else if (st.length == 3) {
          if (st[0] == '>' && st[1] >= v[st[2]]) return false;
          if (st[0] == '<' && st[1] <= v[st[2]]) return false;
        }
      }
      v.sortIndex = match(queryString, v.name);
      return v.sortIndex != -1;
    }).sort((a, b) => b.sortIndex - a.sortIndex);
  }
}

var toFilterBy = [
  'label',
  'state',
  'tracker',
];

// Support Duration
var toCompareBy = [
  ['download', 'downloadSpeed', toBytes],
  ['upload', 'uploadSpeed', toBytes],
  ['size', 'size', toBytes],
  ['ratio', 'ratio'],
  ['progress', 'progress'],
];

function toBytes(count: number, unit: string) {
  if (unit)
    return count * Math.pow(1000, suffix.indexOf(unit.toUpperCase()));
}

// TODO: Prefix Weight
export function match(query: string, record: string): number {
  var q = query.toLowerCase().replace(/ /g, '');
  var r = record.toLowerCase();
  var s = 0;
  var cs = 0;

  var lastMatchIndex = 0;
  for (var i = 0; i < q.length; i++) {
    var c = q[i];

    var x = r.indexOf(c, lastMatchIndex);
    if (x == -1) {
      return -1;
    } else {
      if (lastMatchIndex == x - 1)
        cs += cs + 1;
      else
        cs = 0;

      lastMatchIndex = x;
      s += cs;
    }
  }
  return s;
}

