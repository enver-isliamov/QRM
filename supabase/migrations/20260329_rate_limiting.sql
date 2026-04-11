-- Rate limiting for help requests: max 3 active requests per user
CREATE OR REPLACE FUNCTION check_help_request_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM help_requests WHERE author_id = NEW.author_id AND status = 'active') >= 3 THEN
    RAISE EXCEPTION 'Вы не можете иметь более 3 активных обращений одновременно.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_help_request_limit ON help_requests;
CREATE TRIGGER tr_check_help_request_limit
BEFORE INSERT ON help_requests
FOR EACH ROW
EXECUTE FUNCTION check_help_request_limit();
