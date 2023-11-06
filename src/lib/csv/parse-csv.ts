
import { createReadStream, ReadStream } from 'fs';

import { parser as CsvParser, parse as csvParse } from 'csv';

import { checkFile } from '../../util/files';

export type CsvReader = {
  read: () => Promise<unknown | null>;
};

export function getCsvReader(csvPath: string): CsvReader {
  let csvReader: CsvReader;
  let parseCsvGtr: AsyncGenerator;
  parseCsvGtr = parseCsvGenerator(csvPath);

  const read = async (): Promise<unknown | null> => {
    let recordIt: IteratorResult<unknown>;
    recordIt = await parseCsvGtr.next();
    if(recordIt.done) {
      return null;
    }
    return recordIt.value;
  };

  csvReader = {
    read,
  };
  return csvReader;
}

async function* parseCsvGenerator(csvPath: string) {
  let fileExists: boolean;
  let csvParsePromise: Promise<void> | undefined, csvReadablePromise: Promise<void>;
  let csvParser: CsvParser.Parser, csvRs: ReadStream;

  fileExists = await checkFile(csvPath);
  if(!fileExists) {
    throw new Error(`File doesn't exist at path: ${csvPath}`);
  }

  csvParser = csvParse();
  csvRs = createReadStream(csvPath);
  csvReadablePromise = new Promise<void>((readableResolve, readableReject) => {
    csvParsePromise = new Promise<void>((resolve, reject) => {
      csvParser.on('readable', () => {
        readableResolve();
      });
      csvParser.on('error', (err) => {
        readableReject(err);
        reject(err);
      });
      csvParser.on('end', () => {
        resolve();
      });
    });
  });
  csvRs.pipe(csvParser);
  await csvReadablePromise;
  for await (const record of csvParser) {
    yield record;
  }
  await csvParsePromise;
}